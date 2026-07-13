import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { XMLParser } from "fast-xml-parser";

const prisma = new PrismaClient();
const parser = new XMLParser();



/**
 * Fetch ISAPI endpoint with Digest Auth
 */
export async function fetchIsapi(ip: string, username?: string | null, password?: string | null, endpoint: string = "/ISAPI/System/deviceInfo", options?: { method?: string, body?: string }) {
  const url = `http://${ip}${endpoint}`;
  
  if (!username || !password) {
    throw new Error(`Missing credentials for IP ${ip}`);
  }

  try {
    const basicAuthHeader = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
    
    // Attempt Basic Authentication first
    let response = await fetch(url, {
      method: options?.method || "GET",
      headers: { 
        "Authorization": basicAuthHeader,
        ...(options?.body ? { "Content-Type": "application/xml" } : {})
      },
      body: options?.body
    });
    
    // If Basic Auth is unauthorized, fallback to Digest Auth
    if (response.status === 401) {
      const { default: DigestFetch } = await import("digest-fetch");
      const client = new DigestFetch(username, password);
      response = await client.fetch(url, { 
        method: options?.method || "GET",
        headers: options?.body ? { "Content-Type": "application/xml" } : undefined,
        body: options?.body
      });
    }
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    const xml = await response.text();
    return parser.parse(xml);
  } catch (error: any) {
    console.warn(`[Sync] ISAPI Request failed for ${ip}${endpoint}: ${error.message}`);
    throw error;
  }
}

export function calculateStorage(hddList: any) {
  if (!hddList || !hddList.hdd) return null;
  // fast-xml-parser might return a single object instead of an array if there's only 1 HDD
  const hdds = Array.isArray(hddList.hdd) ? hddList.hdd : [hddList.hdd];
  
  let totalMb = 0;
  let freeMb = 0;
  
  for (const hdd of hdds) {
    totalMb += Number(hdd.capacity) || 0;
    freeMb += Number(hdd.freeSpace) || 0;
  }
  
  // Hikvision usually returns capacity in MB
  const storageTotalTb = Number((totalMb / 1000000).toFixed(2));
  const storageUsedTb = Number(((totalMb - freeMb) / 1000000).toFixed(2));
  
  return { storageTotalTb, storageUsedTb };
}

/**
 * Syncs all cameras and NVRs from the database
 */
export async function runDeviceSync() {
  console.log("[Sync] Starting device synchronization...");
  try {
    const cameras = await prisma.cctvCamera.findMany();
    const nvrs = await prisma.nvr.findMany();

    for (const cam of cameras) {
      if (cam.ipAddress && cam.username && cam.password) {
        try {
          const info = await fetchIsapi(cam.ipAddress, cam.username, cam.password, "/ISAPI/System/deviceInfo");
          
          if (info && info.DeviceInfo) {
            await prisma.cctvCamera.update({
              where: { id: cam.id },
              data: {
                firmwareVersion: info.DeviceInfo.firmwareVersion || cam.firmwareVersion,
                model: info.DeviceInfo.model || cam.model,
                serialNumber: info.DeviceInfo.serialNumber || cam.serialNumber,
                macAddress: info.DeviceInfo.macAddress || cam.macAddress,
                lastPing: new Date().toISOString(),
                status: "online"
              }
            });
            console.log(`[Sync] Updated camera: ${cam.name} (${info.DeviceInfo.model})`);
          } else {
            console.log(`[Sync] Camera ${cam.name} responded, but XML parsing failed.`);
          }
        } catch (e: any) {
          console.error(`[Sync] Failed to sync camera ${cam.name}:`, e.message);
        }
      } else {
        console.log(`[Sync] Skipping camera ${cam.name} (Missing IP, username, or password)`);
      }
    }

    for (const nvr of nvrs) {
      if (nvr.ipAddress && nvr.username && nvr.password) {
        try {
          console.log(`[Sync] Fetching NVR info for ${nvr.name} at ${nvr.ipAddress}...`);
          const info = await fetchIsapi(nvr.ipAddress, nvr.username, nvr.password, "/ISAPI/System/deviceInfo");
          const storage = await fetchIsapi(nvr.ipAddress, nvr.username, nvr.password, "/ISAPI/ContentMgmt/Storage");
          
          let channelsUsed = 0;
          try {
            const channelsInfo = await fetchIsapi(nvr.ipAddress, nvr.username, nvr.password, "/ISAPI/System/Video/inputs/channels");
            if (channelsInfo && channelsInfo.VideoInputChannelList && channelsInfo.VideoInputChannelList.VideoInputChannel) {
              const channels = Array.isArray(channelsInfo.VideoInputChannelList.VideoInputChannel) 
                ? channelsInfo.VideoInputChannelList.VideoInputChannel 
                : [channelsInfo.VideoInputChannelList.VideoInputChannel];
              channelsUsed = channels.length;
            }
          } catch (e) {
            console.warn(`[Sync] Could not fetch standard channels, trying InputProxy fallback...`);
            try {
              const proxyInfo = await fetchIsapi(nvr.ipAddress, nvr.username, nvr.password, "/ISAPI/ContentMgmt/InputProxy/channels");
              if (proxyInfo && proxyInfo.InputProxyChannelList && proxyInfo.InputProxyChannelList.InputProxyChannel) {
                const channels = Array.isArray(proxyInfo.InputProxyChannelList.InputProxyChannel) 
                  ? proxyInfo.InputProxyChannelList.InputProxyChannel 
                  : [proxyInfo.InputProxyChannelList.InputProxyChannel];
                channelsUsed = channels.length;
              }
            } catch (e2) {
               console.warn(`[Sync] InputProxy channels also failed.`);
            }
          }
            let recordingRetentionDays = 0;
          try {
            const searchXml = `<?xml version="1.0" encoding="utf-8"?>
<CMSearchDescription>
  <searchID>1</searchID>
  <trackList><trackID>101</trackID></trackList>
  <timeSpanList>
    <timeSpan>
      <startTime>2000-01-01T00:00:00Z</startTime>
      <endTime>2037-12-31T23:59:59Z</endTime>
    </timeSpan>
  </timeSpanList>
  <maxResults>1</maxResults>
  <searchResultPostion>0</searchResultPostion>
  <metadataList><metadataDescriptor>//recordType.meta.std-cgi.com</metadataDescriptor></metadataList>
</CMSearchDescription>`;
            
            const searchInfo = await fetchIsapi(nvr.ipAddress, nvr.username, nvr.password, "/ISAPI/ContentMgmt/search", {
              method: "POST",
              body: searchXml
            });
            
            let searchMatchItem = searchInfo?.CMSearchResult?.matchList?.searchMatchItem;
            if (searchMatchItem) {
              if (Array.isArray(searchMatchItem)) searchMatchItem = searchMatchItem[0];
              const startTimeStr = searchMatchItem?.timeSpan?.startTime;
              if (startTimeStr) {
                const startTime = new Date(startTimeStr).getTime();
                const now = Date.now();
                const diffDays = Math.round((now - startTime) / (1000 * 60 * 60 * 24));
                if (diffDays > 0) {
                  recordingRetentionDays = diffDays;
                }
              }
            }
          } catch (e) {
            console.warn(`[Sync] Could not fetch retention days for NVR ${nvr.name}`);
          }
          
          let updateData: any = { status: "online" };
          
          if (info && info.DeviceInfo) {
            updateData.firmwareVersion = info.DeviceInfo.firmwareVersion || nvr.firmwareVersion;
            updateData.model = info.DeviceInfo.model || nvr.model;
            updateData.serialNumber = info.DeviceInfo.serialNumber || nvr.serialNumber;
            updateData.macAddress = info.DeviceInfo.macAddress || nvr.macAddress;
          }
          
          if (storage) {
            const hddList = storage.hddList || storage.HddList || (storage.storage && storage.storage.hddList);
            if (hddList) {
              const parsedStorage = calculateStorage(hddList);
              if (parsedStorage) {
                updateData.storageTotalTb = parsedStorage.storageTotalTb;
                updateData.storageUsedTb = parsedStorage.storageUsedTb;
              }
            } else {
              console.log(`[Sync] Unexpected storage response format:`, JSON.stringify(storage).substring(0, 200));
            }
          }
          
          if (channelsUsed > 0) {
            updateData.channelsUsed = channelsUsed;
          }
          
          if (recordingRetentionDays > 0) {
            updateData.recordingRetentionDays = recordingRetentionDays;
          }
          
          await prisma.nvr.update({
            where: { id: nvr.id },
            data: updateData
          });
          console.log(`[Sync] Updated NVR: ${nvr.name} (Model: ${updateData.model || 'Unknown'}, Storage: ${updateData.storageUsedTb}TB / ${updateData.storageTotalTb}TB, Channels: ${channelsUsed}, Retention: ${recordingRetentionDays} days)`);
        } catch (e: any) {
          console.error(`[Sync] Failed to sync NVR ${nvr.name}:`, e.message);
          // Mark NVR as offline if we can't reach it
          await prisma.nvr.update({
            where: { id: nvr.id },
            data: { status: "offline" }
          });
        }
      } else {
        console.log(`[Sync] Skipping NVR ${nvr.name} (Missing IP, username, or password)`);
      }
    }
    
    console.log("[Sync] Synchronization complete.");
  } catch (error) {
    console.error("[Sync] Error running sync job:", error);
  }
}

// Export the cron job starter
export function startSyncJob() {
  // Run every 5 minutes
  cron.schedule("*/5 * * * *", () => {
    runDeviceSync();
  });
  console.log("⏱️  ISAPI Device Sync job scheduled (every 5 minutes)");
  
  // Also run once immediately on startup
  setTimeout(runDeviceSync, 2000);
}
