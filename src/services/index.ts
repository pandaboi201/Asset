import type {
  AppNotification,
  Asset,
  CctvCamera,
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

import { apiRequest, createApiResource, API_BASE_URL } from "./api-client";

/**
 * Central service registry. Every UI page imports from here and never talks
 * to `fetch`/the backend directly, so swapping the API implementation later
 * only requires editing this file.
 *
 * All data below is served by the real backend in /server (Node + SQLite,
 * see server/index.mjs) — there is no in-memory mock data anymore. Run the
 * backend with `npm run server` before starting the frontend dev server.
 */

export const assetService = createApiResource<Asset>("assets");
export const inventoryService = createApiResource<InventoryItem>("inventory");
export const issueService = createApiResource<DeviceIssue>("issues");
export const maintenanceService = createApiResource<MaintenanceTask>("maintenance");
export const repairService = createApiResource<RepairTicket>("repairs");
export const sparePartService = createApiResource<SparePart>("spare-parts");
export const cctvService = createApiResource<CctvCamera>("cctv");
export const nvrService = createApiResource<Nvr>("nvr");
export const upgradeService = createApiResource<DeviceUpgrade>("upgrades");
export const partInstallationService = createApiResource<PartInstallation>("part-installations");
export const userService = createApiResource<User>("users");

/* ------------------------------------------------------------------ */
/* Relationship / aggregation queries                                  */
/* These are computed server-side (see server/relations.mjs) and simply */
/* proxied here so page components don't need to know the API shape.    */
/* ------------------------------------------------------------------ */

export interface AssetHistory {
  issues: DeviceIssue[];
  repairs: RepairTicket[];
  upgrades: DeviceUpgrade[];
  maintenance: MaintenanceTask[];
  parts: PartInstallation[];
  timeline: import("@/types").DeviceHistoryEvent[];
}

/** Full lifecycle history for a single device, merged into a timeline. */
export function getAssetHistory(assetTag: string): Promise<AssetHistory> {
  return apiRequest<AssetHistory>(`/assets/history/${encodeURIComponent(assetTag)}`);
}

/** Devices currently assigned to a given user. */
export function getUserDevices(userId: string): Promise<Asset[]> {
  return apiRequest<Asset[]>(`/users/${encodeURIComponent(userId)}/devices`);
}

/** Every installation of a given spare part (which devices it went into). */
export function getPartInstallations(partId: string): Promise<PartInstallation[]> {
  return apiRequest<PartInstallation[]>(`/spare-parts/${encodeURIComponent(partId)}/installations`);
}

/** Cameras connected to a given NVR. */
export function getNvrCameras(nvr: Nvr): Promise<CctvCamera[]> {
  return apiRequest<CctvCamera[]>(`/nvr/${encodeURIComponent(nvr.id)}/cameras`);
}

export const notificationService = {
  all: () => apiRequest<AppNotification[]>("/notifications"),
  activity: () => apiRequest<import("@/types").ActivityLogEntry[]>("/activity"),
  markRead: (id: string) =>
    apiRequest<AppNotification>(`/notifications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ read: true }),
    }),
  markAllRead: async () => {
    const all = await apiRequest<AppNotification[]>("/notifications");
    await Promise.all(
      all
        .filter((n) => !n.read)
        .map((n) =>
          apiRequest(`/notifications/${n.id}`, {
            method: "PATCH",
            body: JSON.stringify({ read: true }),
          }),
        ),
    );
  },
};

export const dashboardService = {
  kpis: () => apiRequest<import("@/types").KpiMetric[]>("/dashboard/kpis"),
  assetTrend: () => apiRequest<import("@/types").TimeSeriesPoint[]>("/dashboard/asset-trend"),
  assetsByCategory: () => apiRequest<import("@/types").CategoryDatum[]>("/dashboard/assets-by-category"),
  assetsByStatus: () => apiRequest<import("@/types").CategoryDatum[]>("/dashboard/assets-by-status"),
  assetsByDepartment: () => apiRequest<import("@/types").CategoryDatum[]>("/dashboard/assets-by-department"),
  maintenanceByStatus: () => apiRequest<import("@/types").CategoryDatum[]>("/dashboard/maintenance-by-status"),
};

/* ------------------------------------------------------------------ */
/* New organization resources                                          */
/* ------------------------------------------------------------------ */

export interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  headCount: number;
  assetCount: number;
  budget: string;
  location: string;
  status: "active" | "inactive";
}

export interface AppLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  type: "office" | "warehouse" | "datacenter" | "remote";
  assetCount: number;
  capacity: number;
  manager: string;
  status: "active" | "inactive";
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpend: string;
  rating: number;
  status: "active" | "inactive" | "preferred";
  contractEnd?: string;
}

export interface SoftwareLicense {
  id: string;
  name: string;
  vendor: string;
  licenseType: "perpetual" | "subscription" | "volume" | "oem";
  licenseKey: string;
  totalSeats: number;
  usedSeats: number;
  purchaseDate: string;
  expiryDate: string;
  cost: string;
  status: "active" | "expiring" | "expired" | "over-deployed";
  category: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: "create" | "update" | "delete" | "login" | "settings" | "export";
  resource: string;
  resourceType: string;
  details: string;
  ipAddress: string;
}

export const departmentService = createApiResource<Department>("departments");
export const locationService = createApiResource<AppLocation>("locations");
export const vendorService = createApiResource<Vendor>("vendors");
export const softwareLicenseService = createApiResource<SoftwareLicense>("software-licenses");
export const auditLogService = createApiResource<AuditLogEntry>("audit-logs");

/** Bulk-import an array of rows for a given resource type via the backend. */
export function importRows(
  type: "assets" | "inventory" | "users" | "maintenance",
  rows: Record<string, unknown>[],
  actor?: string,
): Promise<{ imported: number; items: unknown[] }> {
  return apiRequest("/import", {
    method: "POST",
    body: JSON.stringify({ type, rows, actor }),
  });
}

/** The currently signed-in user (no auth system yet — always the seeded admin). */
export function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/me");
}

/* ------------------------------------------------------------------ */
/* Settings                                                             */
/* ------------------------------------------------------------------ */

export interface AppSettings {
  organizationName: string;
  supportEmail: string;
  currency: string;
  timezone: string;
  compactMode: boolean;
  reduceMotion: boolean;
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: number;
  notifications: {
    email: boolean;
    push: boolean;
    lowStock: boolean;
    maintenance: boolean;
    security: boolean;
    weekly: boolean;
  };
}

export const settingsService = {
  get: () => apiRequest<AppSettings>("/settings"),
  update: (patch: Partial<AppSettings>) =>
    apiRequest<AppSettings>("/settings", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
};

/**
 * Downloads a CSV export for the given resource type by opening the
 * backend's /api/export/:type endpoint directly (the browser handles the
 * `Content-Disposition: attachment` response as a real file download).
 */
export function exportCsv(
  type:
    | "assets"
    | "inventory"
    | "users"
    | "maintenance"
    | "repairs"
    | "software-licenses"
    | "audit-logs"
    | "departments"
    | "locations"
    | "vendors",
) {
  window.open(`${API_BASE_URL}/export/${type}`, "_blank");
}

export type { AppNotification };
