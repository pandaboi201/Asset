import type {
  AppNotification,
  Asset,
  CctvCamera,
  DeviceIssue,
  InventoryItem,
  MaintenanceTask,
  RepairTicket,
  SparePart,
  User,
} from "@/types";

import { assets } from "@/data/assets";
import { inventory } from "@/data/inventory";
import { deviceIssues } from "@/data/issues";
import { maintenanceTasks } from "@/data/maintenance";
import { repairTickets } from "@/data/repairs";
import { spareParts } from "@/data/spare-parts";
import { cctvCameras } from "@/data/cctv";
import { users } from "@/data/users";
import { activityLog, notifications } from "@/data/notifications";
import {
  assetTrend,
  assetsByCategory,
  assetsByDepartment,
  assetsByStatus,
  kpiMetrics,
  maintenanceByStatus,
  spendTrend,
} from "@/data/analytics";

import { createCollectionService, delay } from "./http";

/**
 * Central service registry. Every UI page imports from here and never touches
 * the mock arrays directly, so wiring a real API means editing only this file.
 */

export const assetService = createCollectionService<Asset>(assets, {
  searchable: ["assetTag", "name", "serialNumber", "manufacturer", "model", "assignedTo.name"],
});

export const inventoryService = createCollectionService<InventoryItem>(
  inventory,
  { searchable: ["sku", "name", "category", "warehouse", "supplier"] },
);

export const issueService = createCollectionService<DeviceIssue>(deviceIssues, {
  searchable: ["reference", "assetTag", "assetName", "issuedTo.name"],
});

export const maintenanceService = createCollectionService<MaintenanceTask>(
  maintenanceTasks,
  { searchable: ["reference", "assetTag", "assetName", "title", "assignedTo.name"] },
);

export const repairService = createCollectionService<RepairTicket>(
  repairTickets,
  { searchable: ["ticketNumber", "assetTag", "assetName", "issueSummary", "reportedBy.name"] },
);

export const sparePartService = createCollectionService<SparePart>(spareParts, {
  searchable: ["partNumber", "name", "category", "supplier"],
});

export const cctvService = createCollectionService<CctvCamera>(cctvCameras, {
  searchable: ["name", "location", "zone", "ipAddress", "model"],
});

export const userService = createCollectionService<User>(users, {
  searchable: ["name", "email", "department", "jobTitle", "location"],
});

export const notificationService = {
  all: () => delay([...notifications]),
  activity: () => delay([...activityLog]),
};

export const dashboardService = {
  kpis: () => delay(kpiMetrics),
  assetTrend: () => delay(assetTrend),
  spendTrend: () => delay(spendTrend),
  assetsByCategory: () => delay(assetsByCategory),
  assetsByStatus: () => delay(assetsByStatus),
  assetsByDepartment: () => delay(assetsByDepartment),
  maintenanceByStatus: () => delay(maintenanceByStatus),
};

export type { AppNotification };
