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

import { createCollectionService, delay } from "./http";

/**
 * Central service registry. Every UI page imports from here.
 * Now connected to the real REST API.
 */

export const assetService = createCollectionService<Asset>("assets");

export const inventoryService = createCollectionService<InventoryItem>("inventory");

export const issueService = createCollectionService<DeviceIssue>("issues");

export const maintenanceService = createCollectionService<MaintenanceTask>("maintenance");

export const repairService = createCollectionService<RepairTicket>("repairs");

export const sparePartService = createCollectionService<SparePart>("spare-parts");

export const cctvService = createCollectionService<CctvCamera>("cctv");

export const nvrService = createCollectionService<Nvr>("nvr");

export const upgradeService = createCollectionService<DeviceUpgrade>("upgrades");

export const partInstallationService = createCollectionService<PartInstallation>("part-installations");

export const userService = createCollectionService<User>("users");

/* ------------------------------------------------------------------ */
/* Relationship / aggregation queries                                  */
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
      title: `Issued to ${it.issuedToName || "Unknown"}`,
      description: `${it.issuedToDept || ""} · due ${new Date(it.dueDate).toLocaleDateString()}`,
      actor: it.issuedBy,
      status: it.status,
      reference: it.reference,
      date: it.issueDate,
    });
    if (it.returnDate) {
      timeline.push({
        id: `t-ret-${it.id}`,
        kind: "return",
        title: `Returned by ${it.issuedToName || "Unknown"}`,
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
      description: r.assignedTechName
        ? `Technician: ${r.assignedTechName}`
        : "Awaiting assignment",
      actor: r.reportedByName || "Unknown",
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
      actor: u.performedByName || "Unknown",
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
      actor: m.assignedToName || "Unknown",
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
      actor: p.installedByName || "Unknown",
      date: p.installedAt,
    });
  }

  timeline.sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return { issues, repairs, upgrades, maintenance, parts: partsUsed, timeline };
}

/** Devices currently assigned to a given user. */
export async function getUserDevices(userId: string): Promise<Asset[]> {
  const all = await assetService.all();
  return all.filter((a) => a.assignedToId === userId);
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
  let set = new Set<string>();
  try {
     const parsed = JSON.parse(nvr.connectedCameraIds);
     if (Array.isArray(parsed)) set = new Set(parsed);
  } catch (e) {
     // Ignore parsing error
  }
  return all.filter((c) => set.has(c.id));
}

const notifBase = createCollectionService<AppNotification>("notifications");
export const notificationService = {
  ...notifBase,
  activity: () => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/activity/all`).then(r => r.json())
};

export const dashboardService = {
  // Since we haven't implemented full dashboard logic in backend yet, 
  // we use standard fetch or fallback to static data if needed.
  kpis: () => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/dashboard`).then(r => r.json()).then(d => d.kpis || []),
  assetTrend: () => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/dashboard`).then(r => r.json()).then(d => d.assetTrend || []),
  assetsByCategory: () => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/dashboard`).then(r => r.json()).then(d => d.assetsByCategory || []),
  assetsByStatus: () => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/dashboard`).then(r => r.json()).then(d => d.assetsByStatus || []),
  assetsByDepartment: () => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/dashboard`).then(r => r.json()).then(d => d.assetsByDepartment || []),
  maintenanceByStatus: () => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/dashboard`).then(r => r.json()).then(d => d.maintenanceByStatus || []),
};

export const settingsService = {
  getAll: async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/settings`);
    if (!res.ok) return {};
    return res.json();
  },
  updateAll: async (payload: Record<string, string[]>) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to update settings");
    return res.json();
  }
};

export type { AppNotification };
