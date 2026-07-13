import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { crudRouter } from "./crudRouter";
import { startSyncJob } from "./syncService";

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
