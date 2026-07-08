import type {
  Asset,
  AssetCategory,
  AssetCondition,
  AssetStatus,
} from "@/types";
import { chance, dateFromNow, pick, randInt } from "./seed";
import { users } from "./users";

const CATEGORIES: AssetCategory[] = [
  "Laptop", "Desktop", "Monitor", "Server", "Network",
  "Printer", "Mobile", "Peripheral", "Tablet", "Storage",
];

const MODELS: Record<AssetCategory, { make: string; model: string; cost: [number, number] }[]> = {
  Laptop: [
    { make: "Apple", model: 'MacBook Pro 14"', cost: [1800, 2600] },
    { make: "Dell", model: "Latitude 7440", cost: [1200, 1800] },
    { make: "Lenovo", model: "ThinkPad X1 Carbon", cost: [1400, 2100] },
    { make: "HP", model: "EliteBook 840", cost: [1100, 1700] },
  ],
  Desktop: [
    { make: "Apple", model: "Mac Studio", cost: [2000, 3200] },
    { make: "Dell", model: "OptiPlex 7010", cost: [900, 1500] },
    { make: "HP", model: "EliteDesk 800", cost: [850, 1400] },
  ],
  Monitor: [
    { make: "Dell", model: "UltraSharp U2723QE", cost: [500, 750] },
    { make: "LG", model: "27UP850", cost: [400, 600] },
    { make: "Samsung", model: "ViewFinity S8", cost: [450, 700] },
  ],
  Server: [
    { make: "Dell", model: "PowerEdge R750", cost: [6000, 12000] },
    { make: "HPE", model: "ProLiant DL380", cost: [7000, 14000] },
  ],
  Network: [
    { make: "Cisco", model: "Catalyst 9300", cost: [3000, 6000] },
    { make: "Ubiquiti", model: "UniFi Dream Machine Pro", cost: [400, 700] },
    { make: "Juniper", model: "EX4400", cost: [4000, 8000] },
  ],
  Printer: [
    { make: "HP", model: "LaserJet Enterprise M611", cost: [500, 900] },
    { make: "Brother", model: "MFC-L8900CDW", cost: [400, 700] },
  ],
  Mobile: [
    { make: "Apple", model: "iPhone 15 Pro", cost: [999, 1299] },
    { make: "Samsung", model: "Galaxy S24", cost: [800, 1200] },
  ],
  Peripheral: [
    { make: "Logitech", model: "MX Master 3S", cost: [90, 120] },
    { make: "Keychron", model: "K8 Pro", cost: [80, 150] },
    { make: "Jabra", model: "Evolve2 65", cost: [180, 260] },
  ],
  Tablet: [
    { make: "Apple", model: 'iPad Pro 12.9"', cost: [1099, 1499] },
    { make: "Microsoft", model: "Surface Pro 9", cost: [1000, 1600] },
  ],
  Storage: [
    { make: "Synology", model: "DiskStation DS1522+", cost: [700, 1100] },
    { make: "Samsung", model: "T7 Shield 2TB", cost: [140, 220] },
  ],
};

const STATUSES: AssetStatus[] = [
  "in-use", "in-use", "in-use", "available", "in-repair",
  "maintenance", "retired",
];
const CONDITIONS: AssetCondition[] = ["new", "good", "good", "fair", "poor"];
const SUPPLIERS = ["CDW", "Insight", "SHI International", "Amazon Business", "Direct"];
const LOCATIONS = [
  "New York HQ - Floor 3", "San Francisco - Floor 2", "London Office",
  "Singapore Hub", "Berlin Office", "Data Center A", "Remote", "Warehouse 1",
];
const DEPARTMENTS = [
  "IT Operations", "Engineering", "Finance", "Human Resources",
  "Sales", "Marketing", "Security", "Support",
];

const TAG_PREFIX: Record<AssetCategory, string> = {
  Laptop: "LT", Desktop: "DT", Monitor: "MN", Server: "SV", Network: "NW",
  Printer: "PR", Mobile: "MB", Peripheral: "PH", Tablet: "TB", Storage: "ST",
};

export const assets: Asset[] = Array.from({ length: 64 }).map((_, i) => {
  const category = pick(CATEGORIES);
  const spec = pick(MODELS[category]);
  const status = pick(STATUSES);
  const ageDays = randInt(30, 1500);
  const assignee =
    status === "in-use" && chance(0.9) ? pick(users) : null;

  return {
    id: `ast-${(i + 1).toString().padStart(4, "0")}`,
    assetTag: `${TAG_PREFIX[category]}-${(1000 + i).toString()}`,
    name: `${spec.make} ${spec.model}`,
    category,
    manufacturer: spec.make,
    model: spec.model,
    serialNumber: `SN${randInt(100000, 999999)}${String.fromCharCode(65 + (i % 26))}`,
    status,
    condition: pick(CONDITIONS),
    assignedTo: assignee
      ? { id: assignee.id, name: assignee.name, avatarUrl: assignee.avatarUrl }
      : null,
    location: pick(LOCATIONS),
    department: pick(DEPARTMENTS),
    purchaseDate: dateFromNow(-ageDays),
    warrantyExpiry: dateFromNow(-ageDays + randInt(365, 1460)),
    supplier: pick(SUPPLIERS),
    notes: undefined,
    createdAt: dateFromNow(-ageDays),
    updatedAt: dateFromNow(-randInt(0, 40)),
  } satisfies Asset;
});

export const ASSET_CATEGORY_OPTIONS = CATEGORIES;
export const ASSET_STATUS_OPTIONS: AssetStatus[] = [
  "in-use", "available", "in-repair", "maintenance", "retired", "lost",
];
export const ASSET_LOCATION_OPTIONS = LOCATIONS;
export const ASSET_DEPARTMENT_OPTIONS = DEPARTMENTS;
