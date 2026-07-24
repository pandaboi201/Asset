// Real persistent database layer — SQLite via Node's built-in `node:sqlite`.
//
// No external dependencies are used anywhere in this backend (no better-sqlite3,
// no express, no npm install required at all) so it runs with just `node server/index.mjs`.
// `node:sqlite` writes to an actual file on disk (server/data/assetflow.db), so data
// persists across server restarts — this is a real database, not an in-memory mock.

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "assetflow.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  job_title TEXT NOT NULL,
  phone TEXT,
  location TEXT NOT NULL,
  status TEXT NOT NULL,
  last_active_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  asset_tag TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  status TEXT NOT NULL,
  condition TEXT NOT NULL,
  assigned_to_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  assigned_to_avatar_url TEXT,
  location TEXT NOT NULL,
  department TEXT NOT NULL,
  purchase_date TEXT NOT NULL,
  warranty_expiry TEXT NOT NULL,
  supplier TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reorder_level INTEGER NOT NULL,
  location TEXT NOT NULL,
  warehouse TEXT NOT NULL,
  supplier TEXT NOT NULL,
  status TEXT NOT NULL,
  last_restocked TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS device_issues (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  asset_tag TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  issued_to_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  issued_to_name TEXT NOT NULL,
  issued_to_avatar_url TEXT,
  issued_to_department TEXT NOT NULL,
  issued_by TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  return_date TEXT,
  status TEXT NOT NULL,
  condition TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  asset_tag TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  assigned_to_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name TEXT NOT NULL,
  assigned_to_avatar_url TEXT,
  scheduled_date TEXT NOT NULL,
  completed_date TEXT,
  vendor TEXT,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS repair_tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  asset_tag TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  issue_summary TEXT NOT NULL,
  reported_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reported_by_name TEXT NOT NULL,
  reported_by_avatar_url TEXT,
  assigned_technician_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  assigned_technician_name TEXT,
  assigned_technician_avatar_url TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  reported_at TEXT NOT NULL,
  resolved_at TEXT,
  vendor TEXT,
  sla_hours INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS spare_parts (
  id TEXT PRIMARY KEY,
  part_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  compatible_with TEXT NOT NULL DEFAULT '[]',
  quantity INTEGER NOT NULL,
  reorder_level INTEGER NOT NULL,
  supplier TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nvrs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  location TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  status TEXT NOT NULL,
  channels_total INTEGER NOT NULL,
  storage_total_tb REAL NOT NULL,
  recording_retention_days INTEGER NOT NULL,
  firmware_version TEXT NOT NULL,
  installed_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cctv_cameras (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  zone TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  model TEXT NOT NULL,
  resolution TEXT NOT NULL,
  status TEXT NOT NULL,
  recording INTEGER NOT NULL DEFAULT 0,
  storage_used_gb REAL NOT NULL,
  storage_total_gb REAL NOT NULL,
  last_ping TEXT NOT NULL,
  installed_date TEXT NOT NULL,
  firmware_version TEXT NOT NULL,
  nvr_id TEXT REFERENCES nvrs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS device_upgrades (
  id TEXT PRIMARY KEY,
  asset_id TEXT REFERENCES assets(id) ON DELETE CASCADE,
  asset_tag TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  from_spec TEXT,
  to_spec TEXT,
  performed_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  performed_by_name TEXT NOT NULL,
  performed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS part_installations (
  id TEXT PRIMARY KEY,
  part_id TEXT REFERENCES spare_parts(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  asset_id TEXT REFERENCES assets(id) ON DELETE CASCADE,
  asset_tag TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  installed_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  installed_by_name TEXT NOT NULL,
  installed_at TEXT NOT NULL,
  repair_ticket_number TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  action_label TEXT,
  action_href TEXT
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  actor_name TEXT NOT NULL,
  actor_avatar_url TEXT,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  head TEXT NOT NULL,
  head_count INTEGER NOT NULL DEFAULT 0,
  budget TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  type TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  manager TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spend_cents INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  contract_end TEXT
);

CREATE TABLE IF NOT EXISTS software_licenses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  license_type TEXT NOT NULL,
  license_key TEXT NOT NULL,
  total_seats INTEGER NOT NULL,
  used_seats INTEGER NOT NULL DEFAULT 0,
  purchase_date TEXT NOT NULL,
  expiry_date TEXT,
  cost_cents_per_year INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_address TEXT NOT NULL
);

-- Simple key/value settings store (organization profile, appearance,
-- notification preferences, security toggles). One row per setting key.
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

export function tableIsEmpty(table) {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get();
  return row.c === 0;
}

export { DB_PATH };
