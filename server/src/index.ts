import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { crudRouter } from "./crudRouter";
import { startSyncJob, fetchIsapi, calculateStorage } from "./syncService";

const prisma = new PrismaClient();
const app = express();

const allowedOrigin = process.env.FRONTEND_URL || "*";
app.use(cors({
  origin: allowedOrigin
}));
app.use(express.json());

// List of all 11 models based on the types and the Prisma schema
const models = [
  "user",
  "asset",
  "inventoryItem",
  "deviceIssue",
  "maintenanceTask",
  "repairTicket",
  "sparePart",
  "cctvCamera",
  "nvr",
  "deviceUpgrade",
  "partInstallation"
];

// Dynamically attach routes for all models
// We map the frontend path (e.g. /api/assets) to the prisma model name (e.g. "asset")
const endpointMapping: Record<string, string> = {
  "users": "user",
  "assets": "asset",
  "inventory": "inventoryItem",
  "issues": "deviceIssue",
  "maintenance": "maintenanceTask",
  "repairs": "repairTicket",
  "spare-parts": "sparePart",
  "cctv": "cctvCamera",
  "nvr": "nvr",
  "upgrades": "deviceUpgrade",
  "part-installations": "partInstallation",
};

for (const [endpoint, modelName] of Object.entries(endpointMapping)) {
  app.use(`/api/${endpoint}`, crudRouter(prisma, modelName));
}

app.get("/api/settings", async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const result: Record<string, string[]> = {};
    for (const setting of settings) {
      try {
        result[setting.key] = JSON.parse(setting.value);
      } catch (e) {
        result[setting.key] = [];
      }
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      if (Array.isArray(value)) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: JSON.stringify(value) },
          create: { key, value: JSON.stringify(value) },
        });
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/isapi/test", async (req, res) => {
  try {
    const { ipAddress, username, password } = req.body;
    if (!ipAddress || !username || !password) {
      return res.status(400).json({ error: "Missing ipAddress, username, or password" });
    }

    const info = await fetchIsapi(ipAddress, username, password, "/ISAPI/System/deviceInfo");
    const modelStr = info?.DeviceInfo?.model || "";
    
    let storageTotalTb = 0;
    let storageUsedTb = 0;
    try {
      const storage = await fetchIsapi(ipAddress, username, password, "/ISAPI/ContentMgmt/Storage");
      if (storage) {
        const hddList = storage.hddList || storage.HddList || (storage.storage && storage.storage.hddList);
        if (hddList) {
          const parsedStorage = calculateStorage(hddList);
          if (parsedStorage) {
            storageTotalTb = parsedStorage.storageTotalTb;
            storageUsedTb = parsedStorage.storageUsedTb;
          }
        }
      }
    } catch (e) {}

    let channelsTotal = 0;
    try {
      let channelsInfo = await fetchIsapi(ipAddress, username, password, "/ISAPI/System/Video/inputs/channels");
      let channels = [];
      if (channelsInfo && channelsInfo.VideoInputChannelList && channelsInfo.VideoInputChannelList.VideoInputChannel) {
        channels = Array.isArray(channelsInfo.VideoInputChannelList.VideoInputChannel) 
          ? channelsInfo.VideoInputChannelList.VideoInputChannel 
          : [channelsInfo.VideoInputChannelList.VideoInputChannel];
      }
      channelsTotal = channels.length;
    } catch (e) {
      try {
        const proxyInfo = await fetchIsapi(ipAddress, username, password, "/ISAPI/ContentMgmt/InputProxy/channels");
        if (proxyInfo && proxyInfo.InputProxyChannelList && proxyInfo.InputProxyChannelList.InputProxyChannel) {
          const channels = Array.isArray(proxyInfo.InputProxyChannelList.InputProxyChannel) 
            ? proxyInfo.InputProxyChannelList.InputProxyChannel 
            : [proxyInfo.InputProxyChannelList.InputProxyChannel];
          channelsTotal = channels.length;
        }
      } catch (e2) {}
    }
    
    let channelsTotalFromModel = 0;
    const match = modelStr.match(/DS-\d{2}(\d{2})/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        channelsTotalFromModel = parsed;
      }
    }
    
    if (channelsTotalFromModel > 0) {
      channelsTotal = channelsTotalFromModel;
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
      
      const searchInfo = await fetchIsapi(ipAddress, username, password, "/ISAPI/ContentMgmt/search", {
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
    } catch (e) {}

    res.json({
      model: info?.DeviceInfo?.model || "",
      manufacturer: info?.DeviceInfo?.manufacturer || "Hikvision",
      serialNumber: info?.DeviceInfo?.serialNumber || "",
      macAddress: info?.DeviceInfo?.macAddress || "",
      firmwareVersion: info?.DeviceInfo?.firmwareVersion || "",
      storageTotalTb,
      storageUsedTb,
      channelsTotal,
      recordingRetentionDays
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API Server running at http://localhost:${PORT}`);
  startSyncJob();
});
