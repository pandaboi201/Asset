import type {
  MaintenanceStatus,
  MaintenanceTask,
  MaintenanceType,
  Priority,
} from "@/types";
import { chance, dateFromNow, money, pick, randInt } from "./seed";
import { assets } from "./assets";
import { users } from "./users";

const TYPES: MaintenanceType[] = ["preventive", "corrective", "inspection"];
const PRIORITIES: Priority[] = ["low", "medium", "medium", "high", "critical"];
const VENDORS = ["OnSite Tech", "Cisco Support", "Dell ProSupport", "Internal Team", "HP Care"];

const TITLES = [
  "Quarterly hardware inspection",
  "Firmware upgrade",
  "Thermal cleaning & fan replacement",
  "Battery health check",
  "OS patch & security update",
  "Disk health diagnostics",
  "Network switch reconfiguration",
  "Preventive server maintenance",
  "Display calibration",
  "Cable management audit",
];

const technicians = users.filter((u) =>
  ["technician", "manager", "admin"].includes(u.role),
);

export const maintenanceTasks: MaintenanceTask[] = Array.from({
  length: 32,
}).map((_, i) => {
  const asset = pick(assets);
  const tech = pick(technicians.length ? technicians : users);
  const scheduledOffset = randInt(-60, 45);
  const isPast = scheduledOffset < 0;
  let status: MaintenanceStatus;
  if (isPast) status = chance(0.75) ? "completed" : "overdue";
  else status = chance(0.3) ? "in-progress" : "scheduled";
  if (chance(0.06)) status = "cancelled";

  const estimatedCost = money(80, 1200);
  const completed = status === "completed";

  return {
    id: `mnt-${(i + 1).toString().padStart(3, "0")}`,
    reference: `MNT-${(5100 + i).toString()}`,
    assetTag: asset.assetTag,
    assetName: asset.name,
    title: pick(TITLES),
    type: pick(TYPES),
    status,
    priority: pick(PRIORITIES),
    assignedTo: { id: tech.id, name: tech.name, avatarUrl: tech.avatarUrl },
    scheduledDate: dateFromNow(scheduledOffset),
    completedDate: completed ? dateFromNow(scheduledOffset + randInt(0, 3)) : null,
    estimatedCost,
    actualCost: completed ? Math.round(estimatedCost * (0.8 + Math.random() * 0.5)) : null,
    vendor: pick(VENDORS),
    description:
      "Routine service performed according to the maintenance policy and manufacturer guidelines.",
  } satisfies MaintenanceTask;
});
