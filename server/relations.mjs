// Cross-resource relationship/aggregation queries — mirrors the joins that
// used to live in the frontend's src/services/index.ts (getAssetHistory,
// getUserDevices, getPartInstallations, getNvrCameras) but now computed
// server-side directly against SQLite.

import { db } from "./crud.mjs";
import {
  issuesResource,
  repairsResource,
  upgradesResource,
  maintenanceResource,
  partInstallationsResource,
  assetsResource,
  cctvResource,
} from "./resources.mjs";

export function getAssetHistory(assetTag) {
  const issues = issuesResource.all().filter((x) => x.assetTag === assetTag);
  const repairs = repairsResource.all().filter((x) => x.assetTag === assetTag);
  const upgrades = upgradesResource.all().filter((x) => x.assetTag === assetTag);
  const maintenance = maintenanceResource.all().filter((x) => x.assetTag === assetTag);
  const parts = partInstallationsResource.all().filter((x) => x.assetTag === assetTag);

  const timeline = [];

  for (const it of issues) {
    timeline.push({
      id: `t-iss-${it.id}`,
      kind: "issue",
      title: `Issued to ${it.issuedTo.name}`,
      description: `${it.issuedTo.department} · due ${new Date(it.dueDate).toLocaleDateString()}`,
      actor: it.issuedBy,
      status: it.status,
      reference: it.reference,
      date: it.issueDate,
    });
    if (it.returnDate) {
      timeline.push({
        id: `t-ret-${it.id}`,
        kind: "return",
        title: `Returned by ${it.issuedTo.name}`,
        description: `Condition on return: ${it.condition}`,
        reference: it.reference,
        date: it.returnDate,
      });
    }
  }
  for (const r of repairs) {
    timeline.push({
      id: `t-rep-${r.id}`,
      kind: "repair",
      title: r.issueSummary,
      description: r.assignedTechnician ? `Technician: ${r.assignedTechnician.name}` : "Awaiting assignment",
      actor: r.reportedBy.name,
      status: r.status,
      reference: r.ticketNumber,
      date: r.reportedAt,
    });
  }
  for (const u of upgrades) {
    timeline.push({
      id: `t-upg-${u.id}`,
      kind: "upgrade",
      title: u.title,
      description: u.fromSpec && u.toSpec ? `${u.fromSpec} → ${u.toSpec}` : u.description,
      actor: u.performedBy.name,
      status: u.type,
      date: u.performedAt,
    });
  }
  for (const m of maintenance) {
    timeline.push({
      id: `t-mnt-${m.id}`,
      kind: "maintenance",
      title: m.title,
      description: `${m.type} maintenance`,
      actor: m.assignedTo.name,
      status: m.status,
      reference: m.reference,
      date: m.completedDate ?? m.scheduledDate,
    });
  }
  for (const p of parts) {
    timeline.push({
      id: `t-part-${p.id}`,
      kind: "part",
      title: `Installed ${p.partName}${p.quantity > 1 ? ` ×${p.quantity}` : ""}`,
      description: p.repairTicketNumber ? `Part ${p.partNumber} · ${p.repairTicketNumber}` : `Part ${p.partNumber}`,
      actor: p.installedBy.name,
      date: p.installedAt,
    });
  }

  timeline.sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return { issues, repairs, upgrades, maintenance, parts, timeline };
}

export function getUserDevices(userId) {
  return assetsResource.all().filter((a) => a.assignedTo?.id === userId);
}

export function getPartInstallationsForPart(partId) {
  return partInstallationsResource
    .all()
    .filter((p) => p.partId === partId)
    .sort((a, b) => +new Date(b.installedAt) - +new Date(a.installedAt));
}

export function getNvrCameras(nvrId) {
  return cctvResource.all().filter((c) => c.nvrId === nvrId);
}
