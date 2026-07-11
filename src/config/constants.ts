import type { User, AssetStatus, AssetCategory } from "@/types";

export const currentUser: User = {
  id: "usr-000",
  name: "Jordan Mitchell",
  email: "jordan.mitchell@acme.io",
  role: "admin",
  department: "IT Operations",
  jobTitle: "IT Operations Director",
  phone: "+1 (415) 555-0142",
  location: "San Francisco",
  status: "active",
  lastActiveAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

export const DEPARTMENT_OPTIONS = [
  "IT Operations", "Engineering", "Finance", "Human Resources", "Sales",
  "Marketing", "Security", "Facilities", "Support", "Legal",
];

export const LOCATION_OPTIONS = [
  "New York HQ", "San Francisco", "London", "Singapore", "Berlin",
  "Toronto", "Austin", "Remote",
];

export const ASSET_CATEGORY_OPTIONS: AssetCategory[] = [
  "Laptop", "Desktop", "Monitor", "Server", "Network", "Printer", "Mobile", "Peripheral", "Tablet", "Storage"
];

export const ASSET_STATUS_OPTIONS: AssetStatus[] = [
  "available", "in-use", "in-repair", "maintenance", "retired", "lost"
];

export const ASSET_LOCATION_OPTIONS = LOCATION_OPTIONS;
export const ASSET_DEPARTMENT_OPTIONS = DEPARTMENT_OPTIONS;

export const CCTV_ZONE_OPTIONS = [
  "Lobby", "Perimeter", "Data Center", "Hallway North", "Hallway South", "Parking Level 1", "Parking Level 2", "Loading Dock"
];

export const INVENTORY_CATEGORY_OPTIONS = [
  "Cable", "Adapter", "Component", "Office Supply", "Tool"
];
export const INVENTORY_WAREHOUSE_OPTIONS = ["Main IT Room", "Server Room A", "Storage B", "Offsite"];

export const SPARE_PART_CATEGORY_OPTIONS = [
  "Memory", "Storage", "Battery", "Screen", "Keyboard", "Network Card", "Power Supply", "Fan"
];

export const notifications: any[] = [];
export const seedNotifications: any[] = [];

// Analytics empty fallbacks
export const kpiMetrics: any[] = [];
export const assetTrend: any[] = [];
export const assetsByCategory: any[] = [];
export const assetsByStatus: any[] = [];
export const assetsByDepartment: any[] = [];
export const maintenanceByStatus: any[] = [];
