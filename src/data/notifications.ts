import type { ActivityLogEntry, AppNotification } from "@/types";
import { dateFromNow, pick, randInt } from "./seed";
import { users } from "./users";

export const notifications: AppNotification[] = [
  {
    id: "ntf-001",
    type: "warning",
    title: "Low stock alert",
    message: "USB-C Charger 96W has dropped below its reorder level (6 remaining).",
    read: false,
    createdAt: dateFromNow(0),
    actionLabel: "View inventory",
    actionHref: "/inventory",
  },
  {
    id: "ntf-002",
    type: "maintenance",
    title: "Maintenance due",
    message: "Preventive maintenance for SV-1012 (PowerEdge R750) is scheduled tomorrow.",
    read: false,
    createdAt: dateFromNow(0),
    actionLabel: "Open task",
    actionHref: "/maintenance",
  },
  {
    id: "ntf-003",
    type: "security",
    title: "Camera offline",
    message: "CAM-07 in the Server Room stopped responding 2 hours ago.",
    read: false,
    createdAt: dateFromNow(0),
    actionLabel: "Inspect camera",
    actionHref: "/cctv",
  },
  {
    id: "ntf-004",
    type: "error",
    title: "Repair SLA breached",
    message: "Ticket RPR-7312 has exceeded its 48h SLA and needs escalation.",
    read: false,
    createdAt: dateFromNow(-1),
    actionLabel: "View ticket",
    actionHref: "/repairs",
  },
  {
    id: "ntf-005",
    type: "success",
    title: "Asset returned",
    message: "LT-1004 (MacBook Pro 14\") was returned in good condition.",
    read: true,
    createdAt: dateFromNow(-1),
  },
  {
    id: "ntf-006",
    type: "info",
    title: "New device assigned",
    message: "A new laptop was assigned to Priya Patel in Engineering.",
    read: true,
    createdAt: dateFromNow(-2),
  },
  {
    id: "ntf-007",
    type: "warning",
    title: "Warranty expiring",
    message: "5 assets have warranties expiring within the next 30 days.",
    read: true,
    createdAt: dateFromNow(-3),
    actionLabel: "Review assets",
    actionHref: "/assets",
  },
  {
    id: "ntf-008",
    type: "maintenance",
    title: "Firmware update available",
    message: "12 network devices have a pending firmware update.",
    read: true,
    createdAt: dateFromNow(-4),
  },
];

const ACTIONS: { action: string; type: ActivityLogEntry["type"] }[] = [
  { action: "created asset", type: "create" },
  { action: "assigned device to", type: "assign" },
  { action: "updated inventory for", type: "update" },
  { action: "resolved repair ticket", type: "resolve" },
  { action: "completed maintenance on", type: "update" },
  { action: "retired asset", type: "delete" },
  { action: "signed in from", type: "login" },
  { action: "returned device", type: "update" },
];
const TARGETS = [
  "LT-1002", "SV-1012", "MN-1030", "RPR-7305", "MNT-5110",
  "New York HQ", "NW-1044", "Priya Patel", "SKU-4012", "CAM-03",
];

export const activityLog: ActivityLogEntry[] = Array.from({ length: 24 }).map(
  (_, i) => {
    const actor = pick(users);
    const entry = pick(ACTIONS);
    return {
      id: `act-${(i + 1).toString().padStart(3, "0")}`,
      actor: { name: actor.name, avatarUrl: actor.avatarUrl },
      action: entry.action,
      target: pick(TARGETS),
      timestamp: dateFromNow(-Math.floor(i / 3) - randInt(0, 1)),
      type: entry.type,
    } satisfies ActivityLogEntry;
  },
);
