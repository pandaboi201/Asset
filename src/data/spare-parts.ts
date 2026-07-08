import type { SparePart, SparePartStatus } from "@/types";
import { dateFromNow, money, pick, pickMany, randInt } from "./seed";

const PARTS = [
  { name: "Laptop Battery (Li-Ion)", category: "Power" },
  { name: "LCD Panel 14\"", category: "Display" },
  { name: "SSD 512GB", category: "Storage" },
  { name: "Cooling Fan Assembly", category: "Cooling" },
  { name: "Keyboard Module", category: "Input" },
  { name: "RAM Module 8GB", category: "Memory" },
  { name: "Power Adapter 65W", category: "Power" },
  { name: "Wi-Fi Card M.2", category: "Networking" },
  { name: "Hinge Set", category: "Mechanical" },
  { name: "Speaker Unit", category: "Audio" },
  { name: "Trackpad Assembly", category: "Input" },
  { name: "Motherboard (refurb)", category: "Logic Board" },
  { name: "Display Cable Flex", category: "Cables" },
  { name: "Thermal Pad Kit", category: "Cooling" },
  { name: "Camera Module", category: "Optics" },
  { name: "Charging Port Board", category: "Power" },
];

const COMPATIBLE = [
  "MacBook Pro 14\"", "Latitude 7440", "ThinkPad X1", "EliteBook 840",
  "OptiPlex 7010", "iPhone 15 Pro", "Surface Pro 9", "PowerEdge R750",
];
const SUPPLIERS = ["Parts Direct", "iFixit Pro", "OEM Supply", "TechParts Co", "CDW"];

function statusFor(qty: number, reorder: number): SparePartStatus {
  if (qty === 0) return "out-of-stock";
  if (qty <= reorder) return "low-stock";
  return "in-stock";
}

export const spareParts: SparePart[] = PARTS.map((part, i) => {
  const reorderLevel = randInt(4, 20);
  const quantity = pick([0, randInt(0, reorderLevel), randInt(reorderLevel + 1, 120)]);
  return {
    id: `spp-${(i + 1).toString().padStart(3, "0")}`,
    partNumber: `PN-${(9100 + i).toString()}`,
    name: part.name,
    category: part.category,
    compatibleWith: pickMany(COMPATIBLE, randInt(1, 3)),
    quantity,
    reorderLevel,
    unitCost: money(12, 480),
    supplier: pick(SUPPLIERS),
    location: `Bin ${String.fromCharCode(65 + (i % 6))}-${randInt(1, 24)}`,
    status: statusFor(quantity, reorderLevel),
    updatedAt: dateFromNow(-randInt(0, 45)),
  } satisfies SparePart;
});

export const SPARE_PART_CATEGORY_OPTIONS = Array.from(
  new Set(PARTS.map((p) => p.category)),
);
