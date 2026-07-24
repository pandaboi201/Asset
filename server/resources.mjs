// Row <-> API shape mappers for every domain resource, built on top of the
// generic CRUD engine in crud.mjs. These mirror src/types/index.ts exactly so
// the frontend api client (src/services/*) can be a near drop-in replacement
// for the old in-memory mock services.

import { randomUUID } from "node:crypto";
import { db, createResource } from "./crud.mjs";

function bool(v) {
  return v === 1 || v === true;
}
function toBoolInt(v) {
  return v ? 1 : 0;
}

/* ------------------------------------------------------------------ */
/* Users                                                                */
/* ------------------------------------------------------------------ */
export const usersResource = createResource({
  table: "users",
  searchColumns: ["name", "email", "department", "job_title", "location"],
  defaultSort: "name",
  fieldToColumn: { jobTitle: "job_title" },
  toApi: (r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    avatarUrl: r.avatar_url || undefined,
    role: r.role,
    department: r.department,
    jobTitle: r.job_title,
    phone: r.phone || undefined,
    location: r.location,
    status: r.status,
    lastActiveAt: r.last_active_at,
    createdAt: r.created_at,
  }),
  toRow: (a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    avatar_url: a.avatarUrl ?? null,
    role: a.role,
    department: a.department,
    job_title: a.jobTitle,
    phone: a.phone ?? null,
    location: a.location,
    status: a.status ?? "active",
    last_active_at: a.lastActiveAt ?? new Date().toISOString(),
    created_at: a.createdAt ?? new Date().toISOString(),
  }),
  insertColumns: ["id", "name", "email", "avatar_url", "role", "department", "job_title", "phone", "location", "status", "last_active_at", "created_at"],
});

function findUser(id) {
  if (!id) return null;
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}
function findUserByName(name) {
  if (!name) return null;
  return db.prepare("SELECT * FROM users WHERE name = ?").get(name);
}

/* ------------------------------------------------------------------ */
/* Assets                                                               */
/* ------------------------------------------------------------------ */
export const assetsResource = createResource({
  table: "assets",
  searchColumns: ["asset_tag", "name", "serial_number", "manufacturer", "model", "assigned_to_name"],
  defaultSort: "updated_at",
  fieldToColumn: {
    assetTag: "asset_tag", serialNumber: "serial_number",
    "assignedTo.name": "assigned_to_name", updatedAt: "updated_at", purchaseDate: "purchase_date",
  },
  toApi: (r) => ({
    id: r.id,
    assetTag: r.asset_tag,
    name: r.name,
    category: r.category,
    manufacturer: r.manufacturer,
    model: r.model,
    serialNumber: r.serial_number,
    status: r.status,
    condition: r.condition,
    assignedTo: r.assigned_to_id
      ? { id: r.assigned_to_id, name: r.assigned_to_name, avatarUrl: r.assigned_to_avatar_url || undefined }
      : null,
    location: r.location,
    department: r.department,
    purchaseDate: r.purchase_date,
    warrantyExpiry: r.warranty_expiry,
    supplier: r.supplier,
    notes: r.notes || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }),
  toRow: (a) => {
    let assignedId = a.assignedTo?.id ?? null;
    let assignedName = a.assignedTo?.name ?? null;
    // Allow the frontend to just send `assignedTo: {name}` and resolve id by name.
    if (assignedName && !assignedId) {
      const match = findUserByName(assignedName);
      if (match) assignedId = match.id;
    }
    return {
      id: a.id,
      asset_tag: a.assetTag,
      name: a.name,
      category: a.category,
      manufacturer: a.manufacturer,
      model: a.model,
      serial_number: a.serialNumber,
      status: a.status ?? "available",
      condition: a.condition ?? "good",
      assigned_to_id: assignedId,
      assigned_to_name: assignedName,
      assigned_to_avatar_url: a.assignedTo?.avatarUrl ?? null,
      location: a.location,
      department: a.department,
      purchase_date: a.purchaseDate ?? new Date().toISOString(),
      warranty_expiry: a.warrantyExpiry ?? new Date().toISOString(),
      supplier: a.supplier,
      notes: a.notes ?? null,
      created_at: a.createdAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },
  insertColumns: ["id", "asset_tag", "name", "category", "manufacturer", "model", "serial_number", "status", "condition", "assigned_to_id", "assigned_to_name", "assigned_to_avatar_url", "location", "department", "purchase_date", "warranty_expiry", "supplier", "notes", "created_at", "updated_at"],
});

/* ------------------------------------------------------------------ */
/* Inventory                                                            */
/* ------------------------------------------------------------------ */
export const inventoryResource = createResource({
  table: "inventory_items",
  searchColumns: ["sku", "name", "category", "warehouse", "supplier"],
  defaultSort: "name",
  toApi: (r) => ({
    id: r.id,
    sku: r.sku,
    name: r.name,
    category: r.category,
    quantity: r.quantity,
    reorderLevel: r.reorder_level,
    location: r.location,
    warehouse: r.warehouse,
    supplier: r.supplier,
    status: r.status,
    lastRestocked: r.last_restocked,
    updatedAt: r.updated_at,
  }),
  toRow: (a) => ({
    id: a.id,
    sku: a.sku,
    name: a.name,
    category: a.category,
    quantity: a.quantity,
    reorder_level: a.reorderLevel,
    location: a.location,
    warehouse: a.warehouse,
    supplier: a.supplier,
    status: a.status,
    last_restocked: a.lastRestocked ?? new Date().toISOString(),
    updated_at: a.updatedAt ?? new Date().toISOString(),
  }),
  insertColumns: ["id", "sku", "name", "category", "quantity", "reorder_level", "location", "warehouse", "supplier", "status", "last_restocked", "updated_at"],
});

/* ------------------------------------------------------------------ */
/* Device issues (check-out / check-in)                                */
/* ------------------------------------------------------------------ */
export const issuesResource = createResource({
  table: "device_issues",
  searchColumns: ["reference", "asset_tag", "asset_name", "issued_to_name"],
  defaultSort: "issue_date",
  toApi: (r) => ({
    id: r.id,
    reference: r.reference,
    assetTag: r.asset_tag,
    assetName: r.asset_name,
    issuedTo: {
      id: r.issued_to_id,
      name: r.issued_to_name,
      avatarUrl: r.issued_to_avatar_url || undefined,
      department: r.issued_to_department,
    },
    issuedBy: r.issued_by,
    issueDate: r.issue_date,
    dueDate: r.due_date,
    returnDate: r.return_date || null,
    status: r.status,
    condition: r.condition,
    notes: r.notes || undefined,
  }),
  toRow: (a) => {
    let issuedToId = a.issuedTo?.id ?? null;
    if (a.issuedTo?.name && !issuedToId) {
      const match = findUserByName(a.issuedTo.name);
      if (match) issuedToId = match.id;
    }
    return {
      id: a.id,
      reference: a.reference,
      asset_tag: a.assetTag,
      asset_name: a.assetName,
      issued_to_id: issuedToId,
      issued_to_name: a.issuedTo?.name,
      issued_to_avatar_url: a.issuedTo?.avatarUrl ?? null,
      issued_to_department: a.issuedTo?.department,
      issued_by: a.issuedBy ?? "IT Service Desk",
      issue_date: a.issueDate ?? new Date().toISOString(),
      due_date: a.dueDate,
      return_date: a.returnDate ?? null,
      status: a.status ?? "issued",
      condition: a.condition ?? "good",
      notes: a.notes ?? null,
    };
  },
  insertColumns: ["id", "reference", "asset_tag", "asset_name", "issued_to_id", "issued_to_name", "issued_to_avatar_url", "issued_to_department", "issued_by", "issue_date", "due_date", "return_date", "status", "condition", "notes"],
});

/* ------------------------------------------------------------------ */
/* Maintenance                                                          */
/* ------------------------------------------------------------------ */
export const maintenanceResource = createResource({
  table: "maintenance_tasks",
  searchColumns: ["reference", "asset_tag", "asset_name", "title", "assigned_to_name"],
  defaultSort: "scheduled_date",
  toApi: (r) => ({
    id: r.id,
    reference: r.reference,
    assetTag: r.asset_tag,
    assetName: r.asset_name,
    title: r.title,
    type: r.type,
    status: r.status,
    priority: r.priority,
    assignedTo: { id: r.assigned_to_id, name: r.assigned_to_name, avatarUrl: r.assigned_to_avatar_url || undefined },
    scheduledDate: r.scheduled_date,
    completedDate: r.completed_date || null,
    vendor: r.vendor || undefined,
    description: r.description,
  }),
  toRow: (a) => {
    let assignedId = a.assignedTo?.id ?? null;
    if (a.assignedTo?.name && !assignedId) {
      const match = findUserByName(a.assignedTo.name);
      if (match) assignedId = match.id;
    }
    return {
      id: a.id,
      reference: a.reference,
      asset_tag: a.assetTag,
      asset_name: a.assetName,
      title: a.title,
      type: a.type,
      status: a.status,
      priority: a.priority,
      assigned_to_id: assignedId,
      assigned_to_name: a.assignedTo?.name,
      assigned_to_avatar_url: a.assignedTo?.avatarUrl ?? null,
      scheduled_date: a.scheduledDate,
      completed_date: a.completedDate ?? null,
      vendor: a.vendor ?? null,
      description: a.description ?? "",
    };
  },
  insertColumns: ["id", "reference", "asset_tag", "asset_name", "title", "type", "status", "priority", "assigned_to_id", "assigned_to_name", "assigned_to_avatar_url", "scheduled_date", "completed_date", "vendor", "description"],
});

/* ------------------------------------------------------------------ */
/* Repairs                                                              */
/* ------------------------------------------------------------------ */
export const repairsResource = createResource({
  table: "repair_tickets",
  searchColumns: ["ticket_number", "asset_tag", "asset_name", "issue_summary", "reported_by_name"],
  defaultSort: "reported_at",
  toApi: (r) => ({
    id: r.id,
    ticketNumber: r.ticket_number,
    assetTag: r.asset_tag,
    assetName: r.asset_name,
    issueSummary: r.issue_summary,
    reportedBy: { id: r.reported_by_id, name: r.reported_by_name, avatarUrl: r.reported_by_avatar_url || undefined },
    assignedTechnician: r.assigned_technician_id
      ? { id: r.assigned_technician_id, name: r.assigned_technician_name, avatarUrl: r.assigned_technician_avatar_url || undefined }
      : null,
    status: r.status,
    priority: r.priority,
    reportedAt: r.reported_at,
    resolvedAt: r.resolved_at || null,
    vendor: r.vendor || undefined,
    slaHours: r.sla_hours,
  }),
  toRow: (a) => {
    let reporterId = a.reportedBy?.id ?? null;
    if (a.reportedBy?.name && !reporterId) {
      const match = findUserByName(a.reportedBy.name);
      if (match) reporterId = match.id;
    }
    let techId = a.assignedTechnician?.id ?? null;
    if (a.assignedTechnician?.name && !techId) {
      const match = findUserByName(a.assignedTechnician.name);
      if (match) techId = match.id;
    }
    return {
      id: a.id,
      ticket_number: a.ticketNumber,
      asset_tag: a.assetTag,
      asset_name: a.assetName,
      issue_summary: a.issueSummary,
      reported_by_id: reporterId,
      reported_by_name: a.reportedBy?.name,
      reported_by_avatar_url: a.reportedBy?.avatarUrl ?? null,
      assigned_technician_id: techId,
      assigned_technician_name: a.assignedTechnician?.name ?? null,
      assigned_technician_avatar_url: a.assignedTechnician?.avatarUrl ?? null,
      status: a.status,
      priority: a.priority,
      reported_at: a.reportedAt ?? new Date().toISOString(),
      resolved_at: a.resolvedAt ?? null,
      vendor: a.vendor ?? null,
      sla_hours: a.slaHours ?? 48,
    };
  },
  insertColumns: ["id", "ticket_number", "asset_tag", "asset_name", "issue_summary", "reported_by_id", "reported_by_name", "reported_by_avatar_url", "assigned_technician_id", "assigned_technician_name", "assigned_technician_avatar_url", "status", "priority", "reported_at", "resolved_at", "vendor", "sla_hours"],
});

/* ------------------------------------------------------------------ */
/* Spare parts                                                          */
/* ------------------------------------------------------------------ */
export const sparePartsResource = createResource({
  table: "spare_parts",
  searchColumns: ["part_number", "name", "category", "supplier"],
  defaultSort: "name",
  toApi: (r) => ({
    id: r.id,
    partNumber: r.part_number,
    name: r.name,
    category: r.category,
    compatibleWith: JSON.parse(r.compatible_with || "[]"),
    quantity: r.quantity,
    reorderLevel: r.reorder_level,
    supplier: r.supplier,
    location: r.location,
    status: r.status,
    updatedAt: r.updated_at,
  }),
  toRow: (a) => ({
    id: a.id,
    part_number: a.partNumber,
    name: a.name,
    category: a.category,
    compatible_with: JSON.stringify(a.compatibleWith ?? []),
    quantity: a.quantity,
    reorder_level: a.reorderLevel,
    supplier: a.supplier,
    location: a.location,
    status: a.status,
    updated_at: a.updatedAt ?? new Date().toISOString(),
  }),
  insertColumns: ["id", "part_number", "name", "category", "compatible_with", "quantity", "reorder_level", "supplier", "location", "status", "updated_at"],
});

/* ------------------------------------------------------------------ */
/* CCTV cameras + NVRs                                                  */
/* ------------------------------------------------------------------ */
export const cctvResource = createResource({
  table: "cctv_cameras",
  searchColumns: ["name", "location", "zone", "ip_address", "model"],
  defaultSort: "name",
  toApi: (r) => ({
    id: r.id,
    name: r.name,
    location: r.location,
    zone: r.zone,
    ipAddress: r.ip_address,
    model: r.model,
    resolution: r.resolution,
    status: r.status,
    recording: bool(r.recording),
    storageUsedGb: r.storage_used_gb,
    storageTotalGb: r.storage_total_gb,
    lastPing: r.last_ping,
    installedDate: r.installed_date,
    firmwareVersion: r.firmware_version,
    nvrId: r.nvr_id || null,
  }),
  toRow: (a) => ({
    id: a.id,
    name: a.name,
    location: a.location,
    zone: a.zone,
    ip_address: a.ipAddress,
    model: a.model,
    resolution: a.resolution,
    status: a.status,
    recording: toBoolInt(a.recording),
    storage_used_gb: a.storageUsedGb,
    storage_total_gb: a.storageTotalGb,
    last_ping: a.lastPing ?? new Date().toISOString(),
    installed_date: a.installedDate ?? new Date().toISOString(),
    firmware_version: a.firmwareVersion,
    nvr_id: a.nvrId ?? null,
  }),
  insertColumns: ["id", "name", "location", "zone", "ip_address", "model", "resolution", "status", "recording", "storage_used_gb", "storage_total_gb", "last_ping", "installed_date", "firmware_version", "nvr_id"],
});

export const nvrResource = createResource({
  table: "nvrs",
  searchColumns: ["name", "manufacturer", "model", "location", "ip_address"],
  defaultSort: "name",
  toApi: (r) => {
    const channelsUsed = db
      .prepare("SELECT COUNT(*) AS c FROM cctv_cameras WHERE nvr_id = ?")
      .get(r.id).c;
    const storageUsedTb = db
      .prepare("SELECT COALESCE(SUM(storage_used_gb), 0) AS s FROM cctv_cameras WHERE nvr_id = ?")
      .get(r.id).s / 1000;
    const connected = db
      .prepare("SELECT id FROM cctv_cameras WHERE nvr_id = ?")
      .all(r.id)
      .map((c) => c.id);
    return {
      id: r.id,
      name: r.name,
      manufacturer: r.manufacturer,
      model: r.model,
      location: r.location,
      ipAddress: r.ip_address,
      status: r.status,
      channelsTotal: r.channels_total,
      channelsUsed,
      storageUsedTb: Math.round(storageUsedTb * 10) / 10,
      storageTotalTb: r.storage_total_tb,
      recordingRetentionDays: r.recording_retention_days,
      firmwareVersion: r.firmware_version,
      installedDate: r.installed_date,
      connectedCameraIds: connected,
    };
  },
  toRow: (a) => ({
    id: a.id,
    name: a.name,
    manufacturer: a.manufacturer,
    model: a.model,
    location: a.location,
    ip_address: a.ipAddress,
    status: a.status,
    channels_total: a.channelsTotal,
    storage_total_tb: a.storageTotalTb,
    recording_retention_days: a.recordingRetentionDays,
    firmware_version: a.firmwareVersion,
    installed_date: a.installedDate ?? new Date().toISOString(),
  }),
  insertColumns: ["id", "name", "manufacturer", "model", "location", "ip_address", "status", "channels_total", "storage_total_tb", "recording_retention_days", "firmware_version", "installed_date"],
});

/* ------------------------------------------------------------------ */
/* Device upgrades + part installations                                */
/* ------------------------------------------------------------------ */
export const upgradesResource = createResource({
  table: "device_upgrades",
  searchColumns: ["asset_tag", "asset_name", "title", "type"],
  defaultSort: "performed_at",
  toApi: (r) => ({
    id: r.id,
    assetId: r.asset_id,
    assetTag: r.asset_tag,
    assetName: r.asset_name,
    type: r.type,
    title: r.title,
    description: r.description,
    fromSpec: r.from_spec || undefined,
    toSpec: r.to_spec || undefined,
    performedBy: { id: r.performed_by_id || undefined, name: r.performed_by_name },
    performedAt: r.performed_at,
  }),
  toRow: (a) => {
    let performedById = a.performedBy?.id ?? null;
    if (a.performedBy?.name && !performedById) {
      const match = findUserByName(a.performedBy.name);
      if (match) performedById = match.id;
    }
    return {
      id: a.id,
      asset_id: a.assetId,
      asset_tag: a.assetTag,
      asset_name: a.assetName,
      type: a.type,
      title: a.title,
      description: a.description,
      from_spec: a.fromSpec ?? null,
      to_spec: a.toSpec ?? null,
      performed_by_id: performedById,
      performed_by_name: a.performedBy?.name,
      performed_at: a.performedAt ?? new Date().toISOString(),
    };
  },
  insertColumns: ["id", "asset_id", "asset_tag", "asset_name", "type", "title", "description", "from_spec", "to_spec", "performed_by_id", "performed_by_name", "performed_at"],
});

export const partInstallationsResource = createResource({
  table: "part_installations",
  searchColumns: ["part_number", "part_name", "asset_tag", "asset_name"],
  defaultSort: "installed_at",
  toApi: (r) => ({
    id: r.id,
    partId: r.part_id,
    partNumber: r.part_number,
    partName: r.part_name,
    assetId: r.asset_id,
    assetTag: r.asset_tag,
    assetName: r.asset_name,
    quantity: r.quantity,
    installedBy: { id: r.installed_by_id || undefined, name: r.installed_by_name },
    installedAt: r.installed_at,
    repairTicketNumber: r.repair_ticket_number || undefined,
  }),
  toRow: (a) => {
    let installedById = a.installedBy?.id ?? null;
    if (a.installedBy?.name && !installedById) {
      const match = findUserByName(a.installedBy.name);
      if (match) installedById = match.id;
    }
    return {
      id: a.id,
      part_id: a.partId,
      part_number: a.partNumber,
      part_name: a.partName,
      asset_id: a.assetId,
      asset_tag: a.assetTag,
      asset_name: a.assetName,
      quantity: a.quantity ?? 1,
      installed_by_id: installedById,
      installed_by_name: a.installedBy?.name,
      installed_at: a.installedAt ?? new Date().toISOString(),
      repair_ticket_number: a.repairTicketNumber ?? null,
    };
  },
  insertColumns: ["id", "part_id", "part_number", "part_name", "asset_id", "asset_tag", "asset_name", "quantity", "installed_by_id", "installed_by_name", "installed_at", "repair_ticket_number"],
});

/* ------------------------------------------------------------------ */
/* Notifications + activity log                                        */
/* ------------------------------------------------------------------ */
export const notificationsResource = createResource({
  table: "notifications",
  searchColumns: ["title", "message"],
  defaultSort: "created_at",
  toApi: (r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message,
    read: bool(r.read),
    createdAt: r.created_at,
    actionLabel: r.action_label || undefined,
    actionHref: r.action_href || undefined,
  }),
  toRow: (a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    message: a.message,
    read: toBoolInt(a.read),
    created_at: a.createdAt ?? new Date().toISOString(),
    action_label: a.actionLabel ?? null,
    action_href: a.actionHref ?? null,
  }),
  insertColumns: ["id", "type", "title", "message", "read", "created_at", "action_label", "action_href"],
});

export function getActivityLog() {
  const rows = db.prepare("SELECT * FROM activity_log ORDER BY timestamp DESC").all();
  return rows.map((r) => ({
    id: r.id,
    actor: { name: r.actor_name, avatarUrl: r.actor_avatar_url || undefined },
    action: r.action,
    target: r.target,
    timestamp: r.timestamp,
    type: r.type,
  }));
}

export function addActivityLog({ actorName, action, target, type }) {
  db.prepare(
    `INSERT INTO activity_log (id, actor_name, actor_avatar_url, action, target, timestamp, type)
     VALUES (?, ?, NULL, ?, ?, ?, ?)`,
  ).run(randomUUID(), actorName, action, target, new Date().toISOString(), type);
}

export function addAuditLog({ actor, action, resource, resourceType, details, ipAddress }) {
  db.prepare(
    `INSERT INTO audit_logs (id, timestamp, actor, action, resource, resource_type, details, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    randomUUID(),
    new Date().toISOString(),
    actor || "System",
    action,
    resource || "—",
    resourceType,
    details,
    ipAddress || "127.0.0.1",
  );
}

/* ------------------------------------------------------------------ */
/* Departments / Locations / Vendors / Software Licenses / Audit logs   */
/* ------------------------------------------------------------------ */
export const departmentsResource = createResource({
  table: "departments",
  searchColumns: ["name", "code", "head"],
  defaultSort: "name",
  toApi: (r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    head: r.head,
    headCount: r.head_count,
    assetCount: db.prepare("SELECT COUNT(*) AS c FROM assets WHERE department = ?").get(r.name).c,
    budget: r.budget,
    location: r.location,
    status: r.status,
  }),
  toRow: (a) => ({
    id: a.id,
    name: a.name,
    code: a.code,
    head: a.head,
    head_count: a.headCount ?? 0,
    budget: a.budget,
    location: a.location,
    status: a.status ?? "active",
  }),
  insertColumns: ["id", "name", "code", "head", "head_count", "budget", "location", "status"],
});

export const locationsResource = createResource({
  table: "locations",
  searchColumns: ["name", "city", "country", "address"],
  defaultSort: "name",
  toApi: (r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    city: r.city,
    country: r.country,
    type: r.type,
    assetCount: db.prepare("SELECT COUNT(*) AS c FROM assets WHERE location LIKE ?").get(`%${r.name}%`).c,
    capacity: r.capacity,
    manager: r.manager,
    status: r.status,
  }),
  toRow: (a) => ({
    id: a.id,
    name: a.name,
    address: a.address,
    city: a.city,
    country: a.country,
    type: a.type,
    capacity: a.capacity ?? 0,
    manager: a.manager,
    status: a.status ?? "active",
  }),
  insertColumns: ["id", "name", "address", "city", "country", "type", "capacity", "manager", "status"],
});

export const vendorsResource = createResource({
  table: "vendors",
  searchColumns: ["name", "category", "contact_person", "email"],
  defaultSort: "name",
  toApi: (r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    contactPerson: r.contact_person,
    email: r.email,
    phone: r.phone,
    totalOrders: r.total_orders,
    totalSpend: `$${(r.total_spend_cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    rating: r.rating,
    status: r.status,
    contractEnd: r.contract_end || undefined,
  }),
  toRow: (a) => ({
    id: a.id,
    name: a.name,
    category: a.category,
    contact_person: a.contactPerson,
    email: a.email,
    phone: a.phone,
    total_orders: a.totalOrders ?? 0,
    total_spend_cents: a.totalSpendCents ?? 0,
    rating: a.rating ?? 0,
    status: a.status ?? "active",
    contract_end: a.contractEnd ?? null,
  }),
  insertColumns: ["id", "name", "category", "contact_person", "email", "phone", "total_orders", "total_spend_cents", "rating", "status", "contract_end"],
});

export const softwareLicensesResource = createResource({
  table: "software_licenses",
  searchColumns: ["name", "vendor", "category"],
  defaultSort: "name",
  toApi: (r) => ({
    id: r.id,
    name: r.name,
    vendor: r.vendor,
    licenseType: r.license_type,
    licenseKey: r.license_key,
    totalSeats: r.total_seats,
    usedSeats: r.used_seats,
    purchaseDate: r.purchase_date,
    expiryDate: r.expiry_date || "—",
    cost: r.license_type === "perpetual"
      ? `$${(r.cost_cents_per_year / 100).toLocaleString("en-US")}`
      : `$${(r.cost_cents_per_year / 100).toLocaleString("en-US")}/yr`,
    status: r.status,
    category: r.category,
  }),
  toRow: (a) => ({
    id: a.id,
    name: a.name,
    vendor: a.vendor,
    license_type: a.licenseType,
    license_key: a.licenseKey,
    total_seats: a.totalSeats,
    used_seats: a.usedSeats ?? 0,
    purchase_date: a.purchaseDate ?? new Date().toISOString(),
    expiry_date: a.expiryDate === "—" ? null : (a.expiryDate ?? null),
    cost_cents_per_year: a.costCentsPerYear ?? 0,
    status: a.status ?? "active",
    category: a.category,
  }),
  insertColumns: ["id", "name", "vendor", "license_type", "license_key", "total_seats", "used_seats", "purchase_date", "expiry_date", "cost_cents_per_year", "status", "category"],
});

/* ------------------------------------------------------------------ */
/* Settings key/value store                                             */
/* ------------------------------------------------------------------ */

const DEFAULT_SETTINGS = {
  organizationName: "Acme Corporation",
  supportEmail: "it-support@acme.io",
  currency: "USD",
  timezone: "pst",
  compactMode: false,
  reduceMotion: false,
  twoFactorEnabled: true,
  sessionTimeoutMinutes: 30,
  notifications: {
    email: true,
    push: true,
    lowStock: true,
    maintenance: true,
    security: true,
    weekly: false,
  },
};

export function getAllSettings() {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const stored = {};
  for (const row of rows) {
    try {
      stored[row.key] = JSON.parse(row.value);
    } catch {
      stored[row.key] = row.value;
    }
  }
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function updateSettings(patch) {
  for (const [key, value] of Object.entries(patch || {})) {
    db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    ).run(key, JSON.stringify(value));
  }
  return getAllSettings();
}

export const auditLogsResource = createResource({
  table: "audit_logs",
  searchColumns: ["actor", "resource", "resource_type", "details"],
  defaultSort: "timestamp",
  toApi: (r) => ({
    id: r.id,
    timestamp: r.timestamp,
    actor: r.actor,
    action: r.action,
    resource: r.resource,
    resourceType: r.resource_type,
    details: r.details,
    ipAddress: r.ip_address,
  }),
  toRow: (a) => ({
    id: a.id,
    timestamp: a.timestamp ?? new Date().toISOString(),
    actor: a.actor,
    action: a.action,
    resource: a.resource ?? "—",
    resource_type: a.resourceType,
    details: a.details,
    ip_address: a.ipAddress ?? "—",
  }),
  insertColumns: ["id", "timestamp", "actor", "action", "resource", "resource_type", "details", "ip_address"],
});
