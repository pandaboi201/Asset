import { Router } from "express";
import { PrismaClient } from "@prisma/client";

export function crudRouter(prisma: PrismaClient, modelName: string) {
  const router = Router();
  // @ts-ignore
  const delegate = prisma[modelName];

  /**
   * Helper function to intercept frontend payloads that have nested relation objects
   * (e.g. issuedTo: {id, name}) and flatten them into the columns Prisma expects (e.g. issuedToId, issuedToName).
   */
  function mapPayload(data: any): any {
    if (!data || typeof data !== "object") return data;
    const result = { ...data };

    const relationalFields = [
      "issuedTo",
      "assignedTo",
      "reportedBy",
      "assignedTechnician",
      "installedBy",
    ];

    for (const field of relationalFields) {
      if (result[field]) {
        // e.g. issuedTo: { id: "1", name: "User" }
        result[`${field}Id`] = result[field].id;
        if (result[field].name !== undefined) result[`${field}Name`] = result[field].name;
        
        // For Assets it's AvatarUrl, for others it's Avatar
        const avatarField = modelName === "asset" ? `${field}AvatarUrl` : `${field}Avatar`;
        
        if (result[field].avatarUrl !== undefined) {
          result[avatarField] = result[field].avatarUrl;
        } else if (result[field].avatar !== undefined) {
          result[avatarField] = result[field].avatar;
        }

        if (result[field].department !== undefined) result[`${field}Dept`] = result[field].department;
        
        // Remove the object so Prisma doesn't complain about unknown property
        delete result[field];
      } else if (result[field] === null) {
        result[`${field}Id`] = null;
        delete result[field];
      }
    }

    // Special fix for Camera (frontend sends storageTotalGb, firmwareVersion, etc which are not in DB)
    if (modelName === "cctvCamera") {
      if (result.status === "recording") {
        result.isRecording = true;
      } else if (result.recording !== undefined) {
        result.isRecording = result.recording;
      }
      delete result.recording;
      delete result.storageUsedGb;
      delete result.storageTotalGb;
      delete result.installedDate;
      delete result.firmwareVersion;
      delete result.nvrId;
      if (!result.macAddress) result.macAddress = "00:00:00:00:00:00";
    }

    // Special fix for MaintenanceTask (frontend sends description which isn't in DB originally)
    if (modelName === "maintenanceTask") {
      if (result.description === undefined) {
        result.description = "";
      }
    }

    // Special fix for RepairTicket (frontend sends slaHours)
    if (modelName === "repairTicket") {
      if (result.slaHours === undefined) result.slaHours = 48;
    }

    // Special fix for PartInstallation
    if (modelName === "partInstallation") {
      delete result.assetId;
    }

    return result;
  }

  function unmapPayload(data: any): any {
    if (!data || typeof data !== "object") return data;
    const result = { ...data };

    const relationalFields = [
      "issuedTo",
      "assignedTo",
      "reportedBy",
      "assignedTechnician",
      "installedBy",
    ];

    for (const field of relationalFields) {
      if (result[`${field}Id`]) {
        const avatarField = modelName === "asset" ? `${field}AvatarUrl` : `${field}Avatar`;
        
        result[field] = {
          id: result[`${field}Id`],
          name: result[`${field}Name`] || "Unknown",
        };
        
        if (result[avatarField] !== undefined) {
          result[field].avatarUrl = result[avatarField];
          delete result[avatarField];
        }
        
        if (result[`${field}Dept`] !== undefined) {
          result[field].department = result[`${field}Dept`];
          delete result[`${field}Dept`];
        }
        
        delete result[`${field}Id`];
        delete result[`${field}Name`];
      }
    }

    if (modelName === "cctvCamera") {
      result.recording = result.isRecording;
      result.status = result.isRecording ? "recording" : result.status;
      result.storageUsedGb = 0;
      result.storageTotalGb = 2000;
      result.installedDate = result.lastPing;
      result.firmwareVersion = "v1.0.0";
      result.nvrId = null;
    }

    return result;
  }

  router.get("/all", async (req, res) => {
    try {
      const items = await delegate.findMany();
      res.json(items.map(unmapPayload));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/query", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      const items = await delegate.findMany({ skip, take });
      const total = await delegate.count();

      res.json({ data: items.map(unmapPayload), total, page, pageSize });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const item = await delegate.findUnique({ where: { id: req.params.id } });
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(unmapPayload(item));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/bulk", async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Expected an array of objects" });
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < req.body.length; i++) {
        try {
          const mappedData = mapPayload(req.body[i]);
          
          if (!mappedData.id) {
            mappedData.id = `bulk-${Date.now()}-${i}`;
          }

          if (modelName === "deviceIssue") {
            const asset = await prisma.asset.findFirst({ where: { assetTag: mappedData.assetTag } });
            if (!asset || (asset.status !== "available" && asset.status !== "in-use")) {
              throw new Error(`Asset ${mappedData.assetTag} is already issued or unavailable.`);
            }
          }

          const item = await delegate.create({ data: mappedData });

          if (modelName === "deviceIssue") {
            const asset = await prisma.asset.findFirst({ where: { assetTag: mappedData.assetTag } });
            if (asset) {
              await prisma.asset.update({
                where: { id: asset.id },
                data: {
                  status: "issued",
                  assignedToId: mappedData.issuedToId,
                  assignedToName: mappedData.issuedToName,
                  assignedToAvatarUrl: mappedData.issuedToAvatar || null,
                }
              });
            }
          }
          results.push(unmapPayload(item));
        } catch (err: any) {
          errors.push({ index: i, item: req.body[i], error: err.message || err });
        }
      }

      res.status(201).json({ success: results.length, failed: errors.length, errors, results });
    } catch (error: any) {
      console.error(`[POST /${modelName}/bulk] Error:`, error);
      res.status(500).json({ error: "Internal Server Error", details: error });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const mappedData = mapPayload(req.body);

      // Before-create validation for DeviceIssue
      if (modelName === "deviceIssue") {
        const asset = await prisma.asset.findFirst({ where: { assetTag: mappedData.assetTag } });
        if (!asset || (asset.status !== "available" && asset.status !== "in-use")) {
          return res.status(400).json({ error: "Asset is already issued or unavailable." });
        }
      }

      const item = await delegate.create({ data: mappedData });

      // After-create hooks for Issue syncing
      if (modelName === "deviceIssue") {
        const asset = await prisma.asset.findFirst({ where: { assetTag: mappedData.assetTag } });
        if (asset) {
          await prisma.asset.update({
            where: { id: asset.id },
            data: {
              status: "issued",
              assignedToId: mappedData.issuedToId,
              assignedToName: mappedData.issuedToName,
              assignedToAvatarUrl: mappedData.issuedToAvatar || null,
            }
          });
        }
      }

      res.status(201).json(unmapPayload(item));
    } catch (error: any) {
      console.error(`[POST /${modelName}] Validation Error:`, error);
      res.status(400).json({ error: "Bad Request", details: error });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const mappedData = mapPayload(req.body);
      const item = await delegate.update({
        where: { id: req.params.id },
        data: mappedData,
      });

      // Hook to sync Asset when Issue is returned
      if (modelName === "deviceIssue" && mappedData.status === "returned") {
        const asset = await prisma.asset.findFirst({ where: { assetTag: item.assetTag } });
        if (asset) {
          await prisma.asset.update({
            where: { id: asset.id },
            data: {
              status: "available",
              assignedToId: null,
              assignedToName: null,
              assignedToAvatarUrl: null,
            }
          });
        }
      }

      res.json(unmapPayload(item));
    } catch (error: any) {
      console.error(`[PATCH /${modelName}/${req.params.id}] Validation Error:`, error);
      res.status(400).json({ error: "Bad Request", details: error });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      await delegate.delete({ where: { id: req.params.id } });
      res.json({ id: req.params.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
