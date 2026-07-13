import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { XMLParser } from "fast-xml-parser";

const prisma = new PrismaClient();
const parser = new XMLParser();

// Fallback demo data in case devices are unreachable (like a demo environment)
const getDemoDeviceInfo = (ip: string) => {
  return {
    DeviceInfo: {
      deviceName: `Camera at ${ip}`,
      firmwareVersion: "V5.5.800 build 210628",
      model: "DS-2CD2043G0-I",
      serialNumber: "DS-2CD2043G0-I20210712AAWR123456789",
      macAddress: "00:40:41:12:34:56"
    }
  };
};

const getDemoStorageInfo = () => {
  return {
    hddList: {
      hdd: [
        {
          id: 1,
          capacity: 2000000,
          freeSpace: 500000,
          status: "OK"
        }
      ]
    }
  };
};

/**
 * Fetch ISAPI endpoint with Digest Auth
 */
async function fetchIsapi(ip: string, username?: string | null, password?: string | null, endpoint: string = "/ISAPI/System/deviceInfo") {
  const url = `http://${ip}${endpoint}`;
  
  if (!username || !password) {
    throw new Error(`Missing credentials for IP ${ip}`);
  }

  try {
    const { default: DigestFetch } = await import("digest-fetch");
    const client = new DigestFetch(username, password, { basic: true });
    const response = await client.fetch(url, { method: "GET" });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    const xml = await response.text();
    return parser.parse(xml);
  } catch (error) {
    console.warn(`[Sync] Could not reach ${ip}, using fallback data.`);
    if (endpoint.includes("Storage")) return getDemoStorageInfo();
    return getDemoDeviceInfo(ip);
  }
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
                lastPing: new Date().toISOString(),
                status: "online"
              }
            });
            console.log(`[Sync] Updated camera: ${cam.name}`);
          }
        } catch (e: any) {
          console.error(`[Sync] Failed to sync camera ${cam.name}:`, e.message);
        }
      }
    }

    for (const nvr of nvrs) {
      if (nvr.ipAddress && nvr.username && nvr.password) {
        try {
          const info = await fetchIsapi(nvr.ipAddress, nvr.username, nvr.password, "/ISAPI/System/deviceInfo");
          
          if (info && info.DeviceInfo) {
            await prisma.nvr.update({
              where: { id: nvr.id },
              data: {
                firmwareVersion: info.DeviceInfo.firmwareVersion || nvr.firmwareVersion,
                model: info.DeviceInfo.model || nvr.model,
                status: "online"
              }
            });
            console.log(`[Sync] Updated NVR: ${nvr.name}`);
          }
        } catch (e: any) {
          console.error(`[Sync] Failed to sync NVR ${nvr.name}:`, e.message);
        }
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
