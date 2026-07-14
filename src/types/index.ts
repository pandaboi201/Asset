/**
 * Domain models for the Enterprise IT Asset & Inventory Management System.
 *
 * These types describe the shape of data the UI consumes. They are intentionally
 * decoupled from any data source so the mock service layer can be swapped for a
 * real API without touching the UI.
 */

export type ID = string;

export type UserRole = "admin" | "manager" | "technician" | "viewer";

export interface User {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  department: string;
  jobTitle: string;
  phone?: string;
  location: string;
  status: "active" | "invited" | "suspended";
  lastActiveAt: string;
  createdAt: string;
}

export type AssetStatus =
  | "in-use"
  | "available"
  | "in-repair"
  | "maintenance"
  | "retired"
  | "lost";

export type AssetCondition = "new" | "good" | "fair" | "poor";

export type AssetCategory =
  | "Laptop"
  | "Desktop"
  | "Monitor"
  | "Server"
  | "Network"
  | "Printer"
  | "Mobile"
  | "Peripheral"
  | "Tablet"
  | "Storage";

export interface Asset {
  id: ID;
  assetTag: string;
  name: string;
  category: AssetCategory;
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: AssetStatus;
  condition: AssetCondition;
  assignedTo?: {
    id: ID;
    name: string;
    avatarUrl?: string;
  } | null;
  location: string;
  department: string;
  purchaseDate: string;
  warrantyExpiry: string;
  supplier: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface InventoryItem {
  id: ID;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  location: string;
  warehouse: string;
  supplier: string;
  status: InventoryStatus;
  lastRestocked: string;
  updatedAt: string;
}

export type IssueStatus = "issued" | "returned" | "overdue" | "pending";

export interface DeviceIssue {
  id: ID;
  reference: string;
  assetTag: string;
  assetName: string;
  issuedTo: {
    id: ID;
    name: string;
    avatarUrl?: string;
    department: string;
  };
  issuedBy: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: IssueStatus;
  condition: AssetCondition;
  notes?: string;
}

export type MaintenanceType = "preventive" | "corrective" | "inspection";
export type MaintenanceStatus =
  | "scheduled"
  | "in-progress"
  | "completed"
  | "overdue"
  | "cancelled";
export type Priority = "low" | "medium" | "high" | "critical";

export interface MaintenanceTask {
  id: ID;
  reference: string;
  assetTag: string;
  assetName: string;
  title: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  priority: Priority;
  assignedTo: {
    id: ID;
    name: string;
    avatarUrl?: string;
  };
  scheduledDate: string;
  completedDate?: string | null;
  vendor?: string;
  description: string;
}

export type RepairStatus =
  | "reported"
  | "diagnosing"
  | "awaiting-parts"
  | "in-repair"
  | "repaired"
  | "unrepairable";

export interface RepairTicket {
  id: ID;
  ticketNumber: string;
  assetTag: string;
  assetName: string;
  issueSummary: string;
  reportedBy: {
    id: ID;
    name: string;
    avatarUrl?: string;
  };
  assignedTechnician: {
    id: ID;
    name: string;
    avatarUrl?: string;
  } | null;
  status: RepairStatus;
  priority: Priority;
  reportedAt: string;
  resolvedAt?: string | null;
  vendor?: string;
  slaHours: number;
}

export type SparePartStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface SparePart {
  id: ID;
  partNumber: string;
  name: string;
  category: string;
  compatibleWith: string[];
  quantity: number;
  reorderLevel: number;
  supplier: string;
  location: string;
  status: SparePartStatus;
  updatedAt: string;
}

export type CameraStatus = "online" | "offline" | "recording" | "maintenance";

export interface CctvCamera {
  id: ID;
  name: string;
  location: string;
  zone: string;
  ipAddress: string;
  model: string;
  resolution: string;
  status: CameraStatus;
  recording: boolean;
  storageUsedGb: number;
  storageTotalGb: number;
  lastPing: string;
  installedDate: string;
  firmwareVersion: string;
  username?: string;
  password?: string;
  nvrId: string | null;
  serialNumber?: string;
}

export type NvrStatus = "online" | "offline" | "degraded" | "maintenance";

export type NvrHddHealth = "healthy" | "warning" | "critical" | "unknown";

/** Network Video Recorder that aggregates and records CCTV camera feeds. */
export interface Nvr {
  id: ID;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  location: string;
  ipAddress: string;
  status: NvrStatus;
  channelsTotal: number;
  channelsUsed: number;
  storageUsedTb: number;
  storageTotalTb: number;
  hddHealth?: NvrHddHealth;
  smartTestStatus?: "passed" | "failed" | "running" | "unknown";
  recordingRetentionDays: number;
  firmwareVersion: string;
  installedDate: string;
  username?: string;
  password?: string;
  connectedCameraIds: string[];
  alerts?: string[];
  supportedEvents?: string[];
}

export type UpgradeType =
  | "memory"
  | "storage"
  | "os"
  | "component"
  | "firmware"
  | "peripheral";

/** A hardware/software upgrade performed on a specific device (asset). */
export interface DeviceUpgrade {
  id: ID;
  assetId: ID;
  assetTag: string;
  assetName: string;
  type: UpgradeType;
  title: string;
  description: string;
  fromSpec?: string;
  toSpec?: string;
  performedBy: {
    id?: ID;
    name: string;
  };
  performedAt: string;
}

/** Record of a spare part being installed into a specific device (asset). */
export interface PartInstallation {
  id: ID;
  partId: ID;
  partNumber: string;
  partName: string;
  assetId: ID;
  assetTag: string;
  assetName: string;
  quantity: number;
  installedBy: {
    id?: ID;
    name: string;
  };
  installedAt: string;
  repairTicketNumber?: string;
}

/**
 * A normalized event on a device's lifecycle timeline. The asset detail page
 * merges issues, returns, repairs, upgrades, maintenance and part swaps into a
 * single chronological history using this shape.
 */
export type DeviceHistoryKind =
  | "issue"
  | "return"
  | "repair"
  | "upgrade"
  | "maintenance"
  | "part";

export interface DeviceHistoryEvent {
  id: string;
  kind: DeviceHistoryKind;
  title: string;
  description?: string;
  actor?: string;
  status?: string;
  reference?: string;
  date: string;
}

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "maintenance"
  | "security";

export interface AppNotification {
  id: ID;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionLabel?: string;
  actionHref?: string;
}

export interface ActivityLogEntry {
  id: ID;
  actor: {
    name: string;
    avatarUrl?: string;
  };
  action: string;
  target: string;
  timestamp: string;
  type: "create" | "update" | "delete" | "assign" | "resolve" | "login";
}

/* ------------------------------------------------------------------ */
/* Dashboard / analytics aggregates                                    */
/* ------------------------------------------------------------------ */

export interface KpiMetric {
  id: string;
  label: string;
  value: number;
  format: "number" | "percent";
  delta: number; // percentage change vs previous period
  trend: "up" | "down" | "flat";
  spark: number[];
}

export interface TimeSeriesPoint {
  date: string;
  [key: string]: string | number;
}

export interface CategoryDatum {
  name: string;
  value: number;
  color?: string;
}

/* ------------------------------------------------------------------ */
/* Generic data-access helpers                                         */
/* ------------------------------------------------------------------ */

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  filters?: Record<string, string | string[] | undefined>;
}
