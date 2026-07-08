import type { PartInstallation } from "@/types";
import { chance, dateFromNow, pick, randInt } from "./seed";
import { assets } from "./assets";
import { spareParts } from "./spare-parts";
import { users } from "./users";

const technicians = users.filter((u) =>
  ["technician", "manager"].includes(u.role),
);

/**
 * Links spare parts to the devices they were installed into. Powers both the
 * "installed on which device" view (spare parts) and the parts history on the
 * device detail page.
 */
export const partInstallations: PartInstallation[] = Array.from({
  length: 30,
}).map((_, i) => {
  const part = pick(spareParts);
  const asset = pick(assets);
  const tech = pick(technicians.length ? technicians : users);
  const quantity = randInt(1, 2);
  return {
    id: `pin-${(i + 1).toString().padStart(3, "0")}`,
    partId: part.id,
    partNumber: part.partNumber,
    partName: part.name,
    assetId: asset.id,
    assetTag: asset.assetTag,
    assetName: asset.name,
    quantity,
    installedBy: { id: tech.id, name: tech.name },
    installedAt: dateFromNow(-randInt(2, 500)),
    repairTicketNumber: chance(0.6)
      ? `RPR-${randInt(7300, 7330)}`
      : undefined,
  } satisfies PartInstallation;
});
