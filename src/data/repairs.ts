import type { Priority, RepairStatus, RepairTicket } from "@/types";
import { chance, dateFromNow, pick, randInt } from "./seed";
import { assets } from "./assets";
import { users } from "./users";

const STATUSES: RepairStatus[] = [
  "reported", "diagnosing", "awaiting-parts", "in-repair",
  "repaired", "repaired", "unrepairable",
];
const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];
const VENDORS = ["Internal Repair Lab", "Dell ProSupport", "Apple Business", "TechFix Partners"];

const ISSUES = [
  "Screen flickering intermittently",
  "Won't power on",
  "Overheating under load",
  "Keyboard keys unresponsive",
  "Battery not charging",
  "Fan making loud noise",
  "Blue screen on startup",
  "Cracked display panel",
  "Port not recognizing devices",
  "Storage drive failure",
  "Wi-Fi module intermittent",
  "Speaker distortion",
];

const technicians = users.filter((u) =>
  ["technician", "manager"].includes(u.role),
);

export const repairTickets: RepairTicket[] = Array.from({ length: 30 }).map(
  (_, i) => {
    const asset = pick(assets);
    const reporter = pick(users);
    const status = pick(STATUSES);
    const resolved = status === "repaired" || status === "unrepairable";
    const reportedDays = randInt(1, 90);
    const assignTech =
      status === "reported" ? (chance(0.4) ? pick(technicians) : null) : pick(technicians);

    return {
      id: `rpr-${(i + 1).toString().padStart(3, "0")}`,
      ticketNumber: `RPR-${(7300 + i).toString()}`,
      assetTag: asset.assetTag,
      assetName: asset.name,
      issueSummary: pick(ISSUES),
      reportedBy: {
        id: reporter.id,
        name: reporter.name,
        avatarUrl: reporter.avatarUrl,
      },
      assignedTechnician: assignTech
        ? { id: assignTech.id, name: assignTech.name, avatarUrl: assignTech.avatarUrl }
        : null,
      status,
      priority: pick(PRIORITIES),
      reportedAt: dateFromNow(-reportedDays),
      resolvedAt: resolved ? dateFromNow(-randInt(0, reportedDays)) : null,
      vendor: pick(VENDORS),
      slaHours: pick([24, 48, 72, 96]),
    } satisfies RepairTicket;
  },
);
