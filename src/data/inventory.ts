import type { InventoryItem, InventoryStatus } from "@/types";
import { dateFromNow, money, pick, randInt } from "./seed";

const ITEMS = [
  { name: "USB-C Charger 96W", category: "Chargers" },
  { name: "HDMI Cable 2m", category: "Cables" },
  { name: "Ethernet Cable Cat6 3m", category: "Cables" },
  { name: "Wireless Mouse", category: "Peripherals" },
  { name: "Mechanical Keyboard", category: "Peripherals" },
  { name: "USB-C Dock Station", category: "Docks" },
  { name: "Laptop Sleeve 14\"", category: "Accessories" },
  { name: "Webcam 1080p", category: "Peripherals" },
  { name: "Headset USB", category: "Audio" },
  { name: "SSD 1TB NVMe", category: "Storage" },
  { name: "RAM 16GB DDR5", category: "Components" },
  { name: "Power Strip 6-outlet", category: "Power" },
  { name: "Monitor Arm Dual", category: "Accessories" },
  { name: "USB Flash Drive 128GB", category: "Storage" },
  { name: "Thermal Paste", category: "Components" },
  { name: "Network Switch 8-port", category: "Networking" },
  { name: "Toner Cartridge Black", category: "Printing" },
  { name: "Label Printer Roll", category: "Printing" },
  { name: "Docking Cable USB4", category: "Cables" },
  { name: "Portable Projector", category: "AV" },
];

const WAREHOUSES = ["Warehouse 1", "Warehouse 2", "NY Storage", "SF Storage"];
const SUPPLIERS = ["CDW", "Insight", "Amazon Business", "Newegg Business", "SHI"];

function statusFor(qty: number, reorder: number): InventoryStatus {
  if (qty === 0) return "out-of-stock";
  if (qty <= reorder) return "low-stock";
  return "in-stock";
}

export const inventory: InventoryItem[] = ITEMS.flatMap((item, idx) => {
  // A couple of items span multiple warehouses for realism.
  const copies = idx % 6 === 0 ? 2 : 1;
  return Array.from({ length: copies }).map((_, c) => {
    const reorderLevel = randInt(10, 40);
    const quantity = pick([0, randInt(0, reorderLevel), randInt(reorderLevel + 1, 300)]);
    return {
      id: `inv-${(idx + 1).toString().padStart(3, "0")}-${c}`,
      sku: `SKU-${(4000 + idx * 3 + c).toString()}`,
      name: item.name,
      category: item.category,
      quantity,
      reorderLevel,
      unitCost: money(8, 320),
      location: `Aisle ${randInt(1, 12)}-${String.fromCharCode(65 + randInt(0, 5))}`,
      warehouse: pick(WAREHOUSES),
      supplier: pick(SUPPLIERS),
      status: statusFor(quantity, reorderLevel),
      lastRestocked: dateFromNow(-randInt(1, 120)),
      updatedAt: dateFromNow(-randInt(0, 20)),
    } satisfies InventoryItem;
  });
});

export const INVENTORY_CATEGORY_OPTIONS = Array.from(
  new Set(ITEMS.map((i) => i.category)),
);
export const INVENTORY_WAREHOUSE_OPTIONS = WAREHOUSES;
