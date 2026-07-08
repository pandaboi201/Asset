import type { Nvr, NvrStatus } from "@/types";
import { dateFromNow, pick, randInt } from "./seed";
import { cctvCameras } from "./cctv";

const DEFS: {
  name: string;
  manufacturer: string;
  model: string;
  channels: number;
  location: string;
  storageTb: number;
  status: NvrStatus;
}[] = [
  { name: "NVR-CORE-01", manufacturer: "Hikvision", model: "DS-9664NI-I8", channels: 16, location: "Server Room A", storageTb: 32, status: "online" },
  { name: "NVR-CORE-02", manufacturer: "Dahua", model: "NVR608-64-4KS2", channels: 16, location: "Server Room A", storageTb: 48, status: "online" },
  { name: "NVR-WEST-01", manufacturer: "Axis", model: "S3016", channels: 8, location: "West Wing IDF", storageTb: 16, status: "online" },
  { name: "NVR-DOCK-01", manufacturer: "Ubiquiti", model: "UNVR-Pro", channels: 12, location: "Loading Dock", storageTb: 24, status: "degraded" },
  { name: "NVR-PERIM-01", manufacturer: "Reolink", model: "RLN36", channels: 12, location: "Perimeter Cabinet", storageTb: 24, status: "online" },
];

// Distribute cameras across NVRs (round-robin, respecting channel capacity).
const buckets: string[][] = DEFS.map(() => []);
let cursor = 0;
for (const camera of cctvCameras) {
  let placed = false;
  for (let attempt = 0; attempt < DEFS.length; attempt++) {
    const idx = (cursor + attempt) % DEFS.length;
    if (buckets[idx].length < DEFS[idx].channels) {
      buckets[idx].push(camera.id);
      camera.nvrId = `nvr-${(idx + 1).toString().padStart(2, "0")}`;
      cursor = (idx + 1) % DEFS.length;
      placed = true;
      break;
    }
  }
  if (!placed) camera.nvrId = null;
}

export const nvrs: Nvr[] = DEFS.map((def, i) => {
  const connected = buckets[i];
  const storageUsedTb = Math.round(def.storageTb * (0.3 + randInt(0, 55) / 100) * 10) / 10;
  return {
    id: `nvr-${(i + 1).toString().padStart(2, "0")}`,
    name: def.name,
    manufacturer: def.manufacturer,
    model: def.model,
    location: def.location,
    ipAddress: `10.20.0.${10 + i}`,
    status: def.status,
    channelsTotal: def.channels,
    channelsUsed: connected.length,
    storageUsedTb,
    storageTotalTb: def.storageTb,
    recordingRetentionDays: pick([14, 30, 30, 60, 90]),
    firmwareVersion: `v${randInt(3, 6)}.${randInt(0, 9)}.${randInt(0, 40)}`,
    installedDate: dateFromNow(-randInt(120, 1400)),
    connectedCameraIds: connected,
  } satisfies Nvr;
});
