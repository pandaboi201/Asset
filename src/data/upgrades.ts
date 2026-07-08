import type { DeviceUpgrade, UpgradeType } from "@/types";
import { dateFromNow, pick, randInt } from "./seed";
import { assets } from "./assets";
import { users } from "./users";

// Upgrades mostly apply to computers / servers.
const UPGRADABLE = ["Laptop", "Desktop", "Server", "Storage"];

const UPGRADES: {
  type: UpgradeType;
  title: string;
  from: string;
  to: string;
  desc: string;
}[] = [
  {
    type: "memory",
    title: "RAM upgrade",
    from: "16 GB",
    to: "32 GB",
    desc: "Increased memory to improve multitasking and build performance.",
  },
  {
    type: "memory",
    title: "RAM upgrade",
    from: "32 GB",
    to: "64 GB",
    desc: "Doubled memory for virtualization workloads.",
  },
  {
    type: "storage",
    title: "SSD upgrade",
    from: "512 GB SSD",
    to: "1 TB NVMe SSD",
    desc: "Replaced storage with faster NVMe drive and larger capacity.",
  },
  {
    type: "storage",
    title: "Added secondary drive",
    from: "1 drive",
    to: "2 drives",
    desc: "Installed a secondary SSD for local data.",
  },
  {
    type: "os",
    title: "OS upgrade",
    from: "Windows 10",
    to: "Windows 11 Pro",
    desc: "Migrated operating system to the latest supported release.",
  },
  {
    type: "os",
    title: "OS upgrade",
    from: "macOS 13",
    to: "macOS 15",
    desc: "Updated macOS to current version with security patches.",
  },
  {
    type: "component",
    title: "GPU upgrade",
    from: "Integrated graphics",
    to: "Dedicated GPU",
    desc: "Added a discrete graphics card for design workloads.",
  },
  {
    type: "component",
    title: "Battery replacement",
    from: "82% health",
    to: "100% health",
    desc: "Swapped in a new battery to restore runtime.",
  },
  {
    type: "firmware",
    title: "Firmware / BIOS update",
    from: "v2.3.1",
    to: "v2.7.0",
    desc: "Applied vendor firmware update for stability and security.",
  },
  {
    type: "peripheral",
    title: "Docking station added",
    from: "None",
    to: "USB-C dock",
    desc: "Provisioned a docking station for multi-monitor setup.",
  },
];

const upgradableAssets = assets.filter((a) => UPGRADABLE.includes(a.category));
const technicians = users.filter((u) =>
  ["technician", "manager", "admin"].includes(u.role),
);

export const deviceUpgrades: DeviceUpgrade[] = Array.from({ length: 34 }).map(
  (_, i) => {
    const asset = pick(upgradableAssets.length ? upgradableAssets : assets);
    const spec = pick(UPGRADES);
    const tech = pick(technicians.length ? technicians : users);
    return {
      id: `upg-${(i + 1).toString().padStart(3, "0")}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      type: spec.type,
      title: spec.title,
      description: spec.desc,
      fromSpec: spec.from,
      toSpec: spec.to,
      performedBy: { id: tech.id, name: tech.name },
      performedAt: dateFromNow(-randInt(3, 720)),
    } satisfies DeviceUpgrade;
  },
);
