// Zero-dependency Node.js backend for the Asset Management System.
//
// Run with:  node server/index.mjs   (or `npm run server`)
// No `npm install` is required for the backend itself — it only uses
// built-in Node modules (node:http, node:sqlite, node:crypto, node:url).
//
// Data is persisted to server/data/assetflow.db (real SQLite file, not
// in-memory) so it survives restarts. Seed data is inserted once and never
// overwrites data you create/edit through the UI afterwards.

import http from "node:http";
import { randomUUID } from "node:crypto";
import { URL } from "node:url";

import { seedDatabase } from "./seed.mjs";
import { db } from "./crud.mjs";
import {
  usersResource,
  assetsResource,
  inventoryResource,
  issuesResource,
  maintenanceResource,
  repairsResource,
  sparePartsResource,
  cctvResource,
  nvrResource,
  upgradesResource,
  partInstallationsResource,
  notificationsResource,
  departmentsResource,
  locationsResource,
  vendorsResource,
  softwareLicensesResource,
  auditLogsResource,
  getActivityLog,
  addActivityLog,
  addAuditLog,
  getAllSettings,
  updateSettings,
} from "./resources.mjs";
import { getAssetHistory, getUserDevices, getPartInstallationsForPart, getNvrCameras } from "./relations.mjs";
import {
  getKpis,
  getAssetTrend,
  getAssetsByCategory,
  getAssetsByStatus,
  getAssetsByDepartment,
  getMaintenanceByStatus,
} from "./analytics.mjs";

const PORT = Number(process.env.PORT || 4000);

seedDatabase();

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(payload);
}

function notFound(res) {
  sendJson(res, 404, { error: "Not found" });
}

function sendCsv(res, filename, rows) {
  const csv = toCsv(rows);
  res.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Access-Control-Allow-Origin": "*",
  });
  res.end(csv);
}

/** Flattens an array of plain-ish objects (one level of nesting via dot access) into CSV text. */
function toCsv(rows) {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]).filter(
    (k) => typeof rows[0][k] !== "object" || rows[0][k] === null,
  );
  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.join(",");
  const body = rows
    .map((row) => columns.map((c) => escape(row[c])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 10_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function parseQueryParams(url) {
  const params = {};
  const search = url.searchParams.get("search");
  const page = url.searchParams.get("page");
  const pageSize = url.searchParams.get("pageSize");
  const sortBy = url.searchParams.get("sortBy");
  const sortDir = url.searchParams.get("sortDir");
  const filtersRaw = url.searchParams.get("filters");
  if (search) params.search = search;
  if (page) params.page = Number(page);
  if (pageSize) params.pageSize = Number(pageSize);
  if (sortBy) params.sortBy = sortBy;
  if (sortDir) params.sortDir = sortDir;
  if (filtersRaw) {
    try {
      params.filters = JSON.parse(filtersRaw);
    } catch {
      /* ignore malformed filters */
    }
  }
  return params;
}

/**
 * Splits a pathname into non-empty segments, e.g. "/api/assets/abc" -> ["api","assets","abc"].
 */
function segmentsOf(path) {
  return path.split("/").filter(Boolean);
}

/**
 * Registers standard REST routes for a resource:
 *   GET    /api/<name>            -> all()
 *   GET    /api/<name>/query      -> query(params)  (search/sort/paginate)
 *   GET    /api/<name>/:id        -> getById(id)
 *   POST   /api/<name>            -> create(body)
 *   PUT    /api/<name>/:id        -> update(id, body)
 *   PATCH  /api/<name>/:id        -> update(id, body)
 *   DELETE /api/<name>/:id        -> remove(id)
 *
 * Matching is done purely by comparing the split segment array (never by
 * string length/startsWith heuristics) so there is no ambiguity about how
 * many segments a given path has.
 */
function registerResourceRoutes(routes, name, resource, opts = {}) {
  const baseSegs = ["api", name];

  routes.push({
    method: "GET",
    match: (path) => {
      const segs = segmentsOf(path);
      return segs.length === 2 && segs[0] === "api" && segs[1] === name;
    },
    handle: async () => resource.all(),
  });
  routes.push({
    method: "GET",
    match: (path) => {
      const segs = segmentsOf(path);
      return segs.length === 3 && segs[0] === "api" && segs[1] === name && segs[2] === "query";
    },
    handle: async (req, res, url) => resource.query(parseQueryParams(url)),
  });
  routes.push({
    method: "GET",
    match: (path) => {
      const segs = segmentsOf(path);
      return segs.length === 3 && segs[0] === "api" && segs[1] === name && segs[2] !== "query";
    },
    handle: async (req, res, url, params) => {
      const item = resource.getById(params.id);
      if (!item) return { __status: 404, error: `${name} ${params.id} not found` };
      return item;
    },
  });
  routes.push({
    method: "POST",
    match: (path) => {
      const segs = segmentsOf(path);
      return segs.length === 2 && segs[0] === "api" && segs[1] === name;
    },
    handle: async (req) => {
      const body = await readBody(req);
      const created = resource.create({ id: body.id || randomUUID(), ...body });
      if (opts.onCreate) opts.onCreate(created);
      return created;
    },
  });
  for (const method of ["PUT", "PATCH"]) {
    routes.push({
      method,
      match: (path) => {
        const segs = segmentsOf(path);
        return segs.length === 3 && segs[0] === "api" && segs[1] === name;
      },
      handle: async (req, res, url, params) => {
        const body = await readBody(req);
        const updated = resource.update(params.id, body);
        if (!updated) return { __status: 404, error: `${name} ${params.id} not found` };
        if (opts.onUpdate) opts.onUpdate(updated, body);
        return updated;
      },
    });
  }
  routes.push({
    method: "DELETE",
    match: (path) => {
      const segs = segmentsOf(path);
      return segs.length === 3 && segs[0] === "api" && segs[1] === name;
    },
    handle: async (req, res, url, params) => {
      if (opts.onDelete) opts.onDelete(params.id);
      return resource.remove(params.id);
    },
  });
}

const routes = [];

registerResourceRoutes(routes, "users", usersResource);
registerResourceRoutes(routes, "assets", assetsResource, {
  onCreate: (a) => addActivityLog({ actorName: "System", action: "created asset", target: a.assetTag, type: "create" }),
  onUpdate: (a) => addActivityLog({ actorName: "System", action: "updated asset", target: a.assetTag, type: "update" }),
  onDelete: (id) => addActivityLog({ actorName: "System", action: "deleted asset", target: id, type: "delete" }),
});
registerResourceRoutes(routes, "inventory", inventoryResource);
registerResourceRoutes(routes, "issues", issuesResource);
registerResourceRoutes(routes, "maintenance", maintenanceResource);
registerResourceRoutes(routes, "repairs", repairsResource);
registerResourceRoutes(routes, "spare-parts", sparePartsResource);
registerResourceRoutes(routes, "cctv", cctvResource);
registerResourceRoutes(routes, "nvr", nvrResource);
registerResourceRoutes(routes, "upgrades", upgradesResource);
registerResourceRoutes(routes, "part-installations", partInstallationsResource);
registerResourceRoutes(routes, "notifications", notificationsResource);
registerResourceRoutes(routes, "departments", departmentsResource);
registerResourceRoutes(routes, "locations", locationsResource);
registerResourceRoutes(routes, "vendors", vendorsResource);
registerResourceRoutes(routes, "software-licenses", softwareLicensesResource);
registerResourceRoutes(routes, "audit-logs", auditLogsResource);

// Aggregation / relationship endpoints
// NOTE: these are registered BEFORE the generic resource routes are matched
// against because the router tries routes in array order and picks the
// first match — but since these use more specific 4-segment patterns
// (api/assets/history/:tag) they never collide with the 3-segment
// api/assets/:id pattern registered above, so order doesn't matter here.
routes.push({
  method: "GET",
  match: (path) => segmentsOf(path).join("/") === "api/activity",
  handle: async () => getActivityLog(),
});
routes.push({
  method: "GET",
  match: (path) => {
    const s = segmentsOf(path);
    return s.length === 4 && s[0] === "api" && s[1] === "assets" && s[2] === "history";
  },
  handle: async (req, res, url, params) => getAssetHistory(decodeURIComponent(params.tag)),
});
routes.push({
  method: "GET",
  match: (path) => {
    const s = segmentsOf(path);
    return s.length === 4 && s[0] === "api" && s[1] === "users" && s[3] === "devices";
  },
  handle: async (req, res, url, params) => getUserDevices(params.userId),
});
routes.push({
  method: "GET",
  match: (path) => {
    const s = segmentsOf(path);
    return s.length === 4 && s[0] === "api" && s[1] === "spare-parts" && s[3] === "installations";
  },
  handle: async (req, res, url, params) => getPartInstallationsForPart(params.partId),
});
routes.push({
  method: "GET",
  match: (path) => {
    const s = segmentsOf(path);
    return s.length === 4 && s[0] === "api" && s[1] === "nvr" && s[3] === "cameras";
  },
  handle: async (req, res, url, params) => getNvrCameras(params.nvrId),
});

// Dashboard analytics endpoints
routes.push({ method: "GET", match: (p) => p === "/api/dashboard/kpis", handle: async () => getKpis() });
routes.push({ method: "GET", match: (p) => p === "/api/dashboard/asset-trend", handle: async () => getAssetTrend() });
routes.push({ method: "GET", match: (p) => p === "/api/dashboard/assets-by-category", handle: async () => getAssetsByCategory() });
routes.push({ method: "GET", match: (p) => p === "/api/dashboard/assets-by-status", handle: async () => getAssetsByStatus() });
routes.push({ method: "GET", match: (p) => p === "/api/dashboard/assets-by-department", handle: async () => getAssetsByDepartment() });
routes.push({ method: "GET", match: (p) => p === "/api/dashboard/maintenance-by-status", handle: async () => getMaintenanceByStatus() });

routes.push({
  method: "GET",
  match: (p) => p === "/api/health",
  handle: async () => ({ ok: true, time: new Date().toISOString() }),
});

// Settings (organization profile, appearance, notification prefs, security).
routes.push({
  method: "GET",
  match: (p) => p === "/api/settings",
  handle: async () => getAllSettings(),
});
routes.push({
  method: "PATCH",
  match: (p) => p === "/api/settings",
  handle: async (req) => {
    const body = await readBody(req);
    const updated = updateSettings(body);
    addAuditLog({
      actor: "Jordan Mitchell",
      action: "settings",
      resource: "—",
      resourceType: "Settings",
      details: `Updated settings: ${Object.keys(body).join(", ")}`,
    });
    return updated;
  },
});

// CSV export — /api/export/:type streams a real CSV file built from live DB rows.
const EXPORTABLE = {
  assets: assetsResource,
  inventory: inventoryResource,
  users: usersResource,
  maintenance: maintenanceResource,
  repairs: repairsResource,
  "software-licenses": softwareLicensesResource,
  "audit-logs": auditLogsResource,
  departments: departmentsResource,
  locations: locationsResource,
  vendors: vendorsResource,
};
routes.push({
  method: "GET",
  match: (path) => {
    const s = segmentsOf(path);
    return s.length === 3 && s[0] === "api" && s[1] === "export";
  },
  handle: async (req, res, url, params) => {
    const resource = EXPORTABLE[params.id];
    if (!resource) {
      return { __status: 400, error: `Unsupported export type: ${params.id}` };
    }
    const rows = resource.all();
    addAuditLog({
      actor: "Jordan Mitchell",
      action: "export",
      resource: `${rows.length} rows`,
      resourceType: params.id,
      details: `Exported ${rows.length} ${params.id} records as CSV`,
    });
    sendCsv(res, `${params.id}.csv`, rows);
    return { __handled: true };
  },
});

// There is no auth system in this app yet, so "/me" always resolves to the
// seeded admin account (usr-000 / Jordan Mitchell) — same convention the old
// static `currentUser` mock used. Swap this for real session lookup later.
routes.push({
  method: "GET",
  match: (p) => p === "/api/me",
  handle: async () => {
    const me = usersResource.getById("usr-000") || usersResource.all()[0];
    if (!me) return { __status: 404, error: "No users found" };
    return me;
  },
});

// Bulk import endpoint used by the Import/Export page (accepts an array of
// records for a given resource and inserts them for real).
const IMPORTABLE = {
  assets: assetsResource,
  inventory: inventoryResource,
  users: usersResource,
  maintenance: maintenanceResource,
};
routes.push({
  method: "POST",
  match: (p) => p === "/api/import",
  handle: async (req) => {
    const body = await readBody(req);
    const resource = IMPORTABLE[body.type];
    if (!resource) return { __status: 400, error: `Unsupported import type: ${body.type}` };
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const created = rows.map((row) => resource.create({ id: randomUUID(), ...row }));
    addAuditLog({
      actor: body.actor || "System",
      action: "create",
      resource: `${created.length} rows`,
      resourceType: body.type,
      details: `Bulk imported ${created.length} ${body.type} records`,
    });
    return { imported: created.length, items: created };
  },
});

/**
 * Pulls the relevant :param out of a path based on segment position.
 * Segment layout reference (index 0 is always "api"):
 *   ["api", name, id]                    -> 3 segs: GET/PUT/PATCH/DELETE /api/<name>/:id
 *   ["api", "assets", "history", tag]    -> 4 segs: GET /api/assets/history/:tag
 *   ["api", "users", userId, "devices"]  -> 4 segs: GET /api/users/:userId/devices
 *   ["api", "spare-parts", partId, "installations"] -> 4 segs
 *   ["api", "nvr", nvrId, "cameras"]     -> 4 segs
 */
function extractParams(path) {
  const segs = segmentsOf(path);
  const params = {};

  if (segs.length === 3) {
    params.id = segs[2];
  } else if (segs.length === 4) {
    const [, resource, third, fourth] = segs;
    if (resource === "assets" && third === "history") {
      params.tag = fourth;
    } else if (resource === "users" && fourth === "devices") {
      params.userId = third;
    } else if (resource === "spare-parts" && fourth === "installations") {
      params.partId = third;
    } else if (resource === "nvr" && fourth === "cameras") {
      params.nvrId = third;
    }
  }
  return params;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const path = url.pathname;
  const params = extractParams(path);

  try {
    const route = routes.find((r) => r.method === req.method && r.match(path));
    if (!route) {
      notFound(res);
      return;
    }
    const result = await route.handle(req, res, url, params);
    if (result && typeof result === "object" && "__handled" in result) {
      // The route handler already wrote its own response (e.g. CSV export).
      return;
    }
    if (result && typeof result === "object" && "__status" in result) {
      sendJson(res, result.__status, { error: result.error });
      return;
    }
    sendJson(res, 200, result);
  } catch (err) {
    console.error(`[server] ${req.method} ${path} failed:`, err);
    sendJson(res, 500, { error: err.message || "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`[server] AssetFlow API listening on http://localhost:${PORT}`);
  console.log(`[server] SQLite database: server/data/assetflow.db`);
});
