import type { CameraStatus, CctvCamera } from "@/types";
import { chance, dateFromNow, pick, randInt } from "./seed";

const ZONES = [
  "Main Entrance", "Parking Lot", "Server Room", "Reception",
  "Warehouse", "Loading Dock", "Corridor 2F", "Cafeteria",
  "Emergency Exit", "Perimeter",
];
const MODELS = [
  { model: "Axis P3268-LV", res: "4K UHD" },
  { model: "Hikvision DS-2CD2386", res: "8MP" },
  { model: "Dahua IPC-HDW5442", res: "4MP" },
  { model: "Ubiquiti G5 Bullet", res: "4MP" },
  { model: "Reolink RLC-1212A", res: "12MP" },
];
const STATUSES: CameraStatus[] = [
  "online", "recording", "recording", "online", "offline", "maintenance",
];

export const cctvCameras: CctvCamera[] = Array.from({ length: 24 }).map(
  (_, i) => {
    const spec = pick(MODELS);
    const status = pick(STATUSES);
    const storageTotal = pick([1000, 2000, 4000]);
    return {
      id: `cam-${(i + 1).toString().padStart(3, "0")}`,
      name: `CAM-${(i + 1).toString().padStart(2, "0")}`,
      location: `${pick(ZONES)} ${chance(0.5) ? "North" : "South"}`,
      zone: pick(ZONES),
      ipAddress: `10.20.${randInt(1, 8)}.${randInt(10, 250)}`,
      model: spec.model,
      resolution: spec.res,
      status,
      recording: status === "recording" || (status === "online" && chance(0.5)),
      storageUsedGb: Math.round(storageTotal * (0.2 + Math.random() * 0.75)),
      storageTotalGb: storageTotal,
      lastPing:
        status === "offline" ? dateFromNow(-randInt(1, 4)) : dateFromNow(0),
      installedDate: dateFromNow(-randInt(90, 1200)),
      firmwareVersion: `v${randInt(2, 6)}.${randInt(0, 9)}.${randInt(0, 20)}`,
    } satisfies CctvCamera;
  },
);

export const CCTV_ZONE_OPTIONS = ZONES;
