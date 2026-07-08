import type {
  AppNotification,
  Asset,
  CctvCamera,
  DeviceHistoryEvent,
  DeviceIssue,
  DeviceUpgrade,
  InventoryItem,
  MaintenanceTask,
  Nvr,
  PartInstallation,
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
import { nvrs } from "@/data/nvr";
import { deviceUpgrades } from "@/data/upgrades";
import { partInstallations } from "@/data/part-installations";
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

export const nvrService = createCollectionService<Nvr>(nvrs, {
  searchable: ["name", "manufacturer", "model", "location", "ipAddress"],
});

export const upgradeService = createCollectionService<DeviceUpgrade>(
  deviceUpgrades,
  { searchable: ["assetTag", "assetName", "title", "type"] },
);

export const partInstallationService =
  createCollectionService<PartInstallation>(partInstallations, {
    searchable: ["partNumber", "partName", "assetTag", "assetName"],
  });

export const userService = createCollectionService<User>(users, {
  searchable: ["name", "email", "department", "jobTitle", "location"],
});

/* ------------------------------------------------------------------ */
/* Relationship / aggregation queries                                  */
/* These join across resources. A real API would expose them as        */
/* dedicated endpoints (e.g. GET /assets/:tag/history).                */
/* ------------------------------------------------------------------ */

export interface AssetHistory {
  issues: DeviceIssue[];
  repairs: RepairTicket[];
  upgrades: DeviceUpgrade[];
  maintenance: MaintenanceTask[];
  parts: PartInstallation[];
  timeline: DeviceHistoryEvent[];
}

/** Full lifecycle history for a single device, merged into a timeline. */
export async function getAssetHistory(assetTag: string): Promise<AssetHistory> {
  const [iss, rep, up, mnt, parts] = await Promise.all([
    issueService.all(),
    repairService.all(),
    upgradeService.all(),
    maintenanceService.all(),
    partInstallationService.all(),
  ]);

  const issues = iss.filter((x) => x.assetTag === assetTag);
  const repairs = rep.filter((x) => x.assetTag === assetTag);
  const upgrades = up.filter((x) => x.assetTag === assetTag);
  const maintenance = mnt.filter((x) => x.assetTag === assetTag);
  const partsUsed = parts.filter((x) => x.assetTag === assetTag);

  const timeline: DeviceHistoryEvent[] = [];

  for (const it of issues) {
    timeline.push({
      id: `t-iss-${it.id}`,
      kind: "issue",
      title: `Issued to ${it.issuedTo.name}`,
      description: `${it.issuedTo.department} · due ${new Date(it.dueDate).toLocaleDateString()}`,
      actor: it.issuedBy,
      status: it.status,
      reference: it.reference,
      date: it.issueDate,
    });
    if (it.returnDate) {
      timeline.push({
        id: `t-ret-${it.id}`,
        kind: "return",
        title: `Returned by ${it.issuedTo.name}`,
        description: `Condition on return: ${it.condition}`,
        reference: it.reference,
        date: it.returnDate,
      });
    }
  }
  for (const r of repairs) {
    timeline.push({
      id: `t-rep-${r.id}`,
      kind: "repair",
      title: r.issueSummary,
      description: r.assignedTechnician
        ? `Technician: ${r.assignedTechnician.name}`
        : "Awaiting assignment",
      actor: r.reportedBy.name,
      status: r.status,
      reference: r.ticketNumber,
      date: r.reportedAt,
    });
  }
  for (const u of upgrades) {
    timeline.push({
      id: `t-upg-${u.id}`,
      kind: "upgrade",
      title: u.title,
      description:
        u.fromSpec && u.toSpec ? `${u.fromSpec} → ${u.toSpec}` : u.description,
      actor: u.performedBy.name,
      status: u.type,
      date: u.performedAt,
    });
  }
  for (const m of maintenance) {
    timeline.push({
      id: `t-mnt-${m.id}`,
      kind: "maintenance",
      title: m.title,
      description: `${m.type} maintenance`,
      actor: m.assignedTo.name,
      status: m.status,
      reference: m.reference,
      date: m.completedDate ?? m.scheduledDate,
    });
  }
  for (const p of partsUsed) {
    timeline.push({
      id: `t-part-${p.id}`,
      kind: "part",
      title: `Installed ${p.partName}${p.quantity > 1 ? ` ×${p.quantity}` : ""}`,
      description: p.repairTicketNumber
        ? `Part ${p.partNumber} · ${p.repairTicketNumber}`
        : `Part ${p.partNumber}`,
      actor: p.installedBy.name,
      date: p.installedAt,
    });
  }

  timeline.sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return { issues, repairs, upgrades, maintenance, parts: partsUsed, timeline };
}

/** Devices currently assigned to a given user. */
export async function getUserDevices(userId: string): Promise<Asset[]> {
  const all = await assetService.all();
  return all.filter((a) => a.assignedTo?.id === userId);
}

/** Every installation of a given spare part (which devices it went into). */
export async function getPartInstallations(
  partId: string,
): Promise<PartInstallation[]> {
  const all = await partInstallationService.all();
  return all
    .filter((p) => p.partId === partId)
    .sort((a, b) => +new Date(b.installedAt) - +new Date(a.installedAt));
}

/** Cameras connected to a given NVR. */
export async function getNvrCameras(nvr: Nvr): Promise<CctvCamera[]> {
  const all = await cctvService.all();
  const set = new Set(nvr.connectedCameraIds);
  return all.filter((c) => set.has(c.id));
}

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
