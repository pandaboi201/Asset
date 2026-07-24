/**
 * Static UI option lists (dropdown/filter choices).
 *
 * These are NOT application data — they never come from the database, they
 * are just the fixed set of choices forms/filters present to the user (e.g.
 * "which categories exist"). Actual records (assets, users, inventory, etc.)
 * are all served by the real backend — see src/services/index.ts.
 */

import type { AssetCategory, AssetStatus } from "@/types";

export const ASSET_CATEGORY_OPTIONS: AssetCategory[] = [
  "Laptop",
  "Desktop",
  "Monitor",
  "Server",
  "Network",
  "Printer",
  "Mobile",
  "Peripheral",
  "Tablet",
  "Storage",
];

export const ASSET_STATUS_OPTIONS: AssetStatus[] = [
  "in-use",
  "available",
  "in-repair",
  "maintenance",
  "retired",
  "lost",
];

export const ASSET_LOCATION_OPTIONS = [
  "New York HQ - Floor 3",
  "San Francisco - Floor 2",
  "London Office",
  "Singapore Office",
  "Austin Office",
  "US-West Data Center",
  "Remote",
  "Central Warehouse",
];

export const ASSET_DEPARTMENT_OPTIONS = [
  "IT Operations",
  "Engineering",
  "Finance",
  "Human Resources",
  "Sales",
  "Marketing",
  "Support",
  "Legal",
];

export const INVENTORY_CATEGORY_OPTIONS = [
  "Chargers",
  "Cables",
  "Peripherals",
  "Docks",
  "Accessories",
  "Audio",
  "Storage",
  "Components",
  "Power",
  "Networking",
  "Printing",
  "AV",
];

export const INVENTORY_WAREHOUSE_OPTIONS = [
  "Central Warehouse",
  "SF Storage",
  "NY Storage",
];

export const SPARE_PART_CATEGORY_OPTIONS = [
  "Power",
  "Display",
  "Storage",
  "Cooling",
  "Input",
  "Memory",
  "Networking",
  "Mechanical",
];

export const CCTV_ZONE_OPTIONS = [
  "Main Entrance",
  "Parking Lot",
  "Server Room",
  "Reception",
  "Warehouse",
  "Loading Dock",
  "Corridor 2F",
  "Cafeteria",
];

export const USER_DEPARTMENT_OPTIONS = [
  "IT Operations",
  "Engineering",
  "Finance",
  "Human Resources",
  "Sales",
  "Marketing",
  "Support",
  "Legal",
];

export const USER_LOCATION_OPTIONS = [
  "San Francisco",
  "New York HQ",
  "London",
  "Austin",
  "Singapore",
];
