// Concrete, hand-written seed data — NOT procedurally/randomly generated.
// Seeding is idempotent: it only runs once per table (skipped if rows already exist),
// so restarting the server never duplicates or resets data you've created through the UI.

import { randomUUID } from "node:crypto";
import { db, tableIsEmpty } from "./db.mjs";

const now = () => new Date().toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString();

function insertMany(table, columns, rows) {
  const placeholders = columns.map(() => "?").join(", ");
  const stmt = db.prepare(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
  );
  for (const row of rows) {
    stmt.run(...columns.map((c) => row[c] ?? null));
  }
}

export function seedDatabase() {
  seedUsers();
  seedDepartments();
  seedLocations();
  seedVendors();
  seedAssets();
  seedInventory();
  seedIssues();
  seedMaintenance();
  seedRepairs();
  seedSpareParts();
  seedNvrsAndCameras();
  seedUpgrades();
  seedPartInstallations();
  seedSoftwareLicenses();
  seedNotifications();
  seedActivityLog();
  seedAuditLogs();
}

let userIds = {};

function seedUsers() {
  if (!tableIsEmpty("users")) return;
  const people = [
    { name: "Jordan Mitchell", email: "jordan.mitchell@acme.io", role: "admin", department: "IT Operations", jobTitle: "IT Operations Director", phone: "+1 (415) 555-0142", location: "San Francisco" },
    { name: "Sarah Chen", email: "sarah.chen@acme.io", role: "manager", department: "Engineering", jobTitle: "Engineering Manager", phone: "+1 (415) 555-0198", location: "San Francisco" },
    { name: "Marcus Williams", email: "marcus.williams@acme.io", role: "technician", department: "IT Operations", jobTitle: "Senior IT Technician", phone: "+1 (212) 555-0110", location: "New York HQ" },
    { name: "Amanda Foster", email: "amanda.foster@acme.io", role: "manager", department: "Human Resources", jobTitle: "HR Manager", phone: "+1 (212) 555-0187", location: "New York HQ" },
    { name: "Robert Kim", email: "robert.kim@acme.io", role: "manager", department: "Finance", jobTitle: "Finance Manager", phone: "+1 (415) 555-0176", location: "San Francisco" },
    { name: "Emily Zhang", email: "emily.zhang@acme.io", role: "technician", department: "IT Operations", jobTitle: "Network Engineer", phone: "+44 20 7946 0192", location: "London" },
    { name: "David Rodriguez", email: "david.rodriguez@acme.io", role: "technician", department: "IT Operations", jobTitle: "Systems Administrator", phone: "+1 (415) 555-0143", location: "San Francisco" },
    { name: "Linda Thompson", email: "linda.thompson@acme.io", role: "viewer", department: "Support", jobTitle: "Support Specialist", phone: "+1 (512) 555-0129", location: "Austin" },
    { name: "James Mitchell", email: "james.mitchell@acme.io", role: "manager", department: "IT Operations", jobTitle: "IT Support Manager", phone: "+1 (415) 555-0155", location: "San Francisco" },
    { name: "Priya Patel", email: "priya.patel@acme.io", role: "viewer", department: "Engineering", jobTitle: "Software Engineer", phone: "+1 (415) 555-0166", location: "San Francisco" },
    { name: "Michael Scott", email: "michael.scott@acme.io", role: "viewer", department: "Legal", jobTitle: "Legal Counsel", phone: "+1 (212) 555-0121", location: "New York HQ" },
    { name: "Nina Okafor", email: "nina.okafor@acme.io", role: "technician", department: "IT Operations", jobTitle: "Help Desk Agent", phone: "+1 (512) 555-0134", location: "Austin" },
    { name: "Diego Alvarez", email: "diego.alvarez@acme.io", role: "viewer", department: "Sales", jobTitle: "Account Executive", phone: "+1 (415) 555-0188", location: "San Francisco" },
    { name: "Yuki Tanaka", email: "yuki.tanaka@acme.io", role: "viewer", department: "Marketing", jobTitle: "Marketing Specialist", phone: "+65 6123 4567", location: "Singapore" },
    { name: "Omar Haddad", email: "omar.haddad@acme.io", role: "technician", department: "IT Operations", jobTitle: "Security Analyst", phone: "+44 20 7946 0155", location: "London" },
  ];
  const rows = people.map((p, i) => ({
    id: i === 0 ? "usr-000" : `usr-${(i).toString().padStart(3, "0")}`,
    name: p.name,
    email: p.email,
    avatar_url: null,
    role: p.role,
    department: p.department,
    job_title: p.jobTitle,
    phone: p.phone,
    location: p.location,
    status: "active",
    last_active_at: daysAgo(i % 5),
    created_at: daysAgo(400 - i * 10),
  }));
  insertMany(
    "users",
    ["id", "name", "email", "avatar_url", "role", "department", "job_title", "phone", "location", "status", "last_active_at", "created_at"],
    rows,
  );
  for (const r of rows) userIds[r.name] = r.id;
}

function u(name) {
  return userIds[name];
}

function seedDepartments() {
  if (!tableIsEmpty("departments")) return;
  const rows = [
    { name: "Engineering", code: "ENG", head: "Sarah Chen", head_count: 45, budget: "$2.4M", location: "Floor 3", status: "active" },
    { name: "Product Design", code: "DSG", head: "Marcus Williams", head_count: 18, budget: "$800K", location: "Floor 3", status: "active" },
    { name: "Marketing", code: "MKT", head: "Yuki Tanaka", head_count: 22, budget: "$1.2M", location: "Floor 2", status: "active" },
    { name: "Sales", code: "SAL", head: "David Rodriguez", head_count: 30, budget: "$1.8M", location: "Floor 2", status: "active" },
    { name: "Human Resources", code: "HR", head: "Amanda Foster", head_count: 12, budget: "$450K", location: "Floor 1", status: "active" },
    { name: "Finance", code: "FIN", head: "Robert Kim", head_count: 15, budget: "$600K", location: "Floor 1", status: "active" },
    { name: "IT Operations", code: "OPS", head: "James Mitchell", head_count: 20, budget: "$3.1M", location: "Floor 4", status: "active" },
    { name: "Support", code: "SUP", head: "Linda Thompson", head_count: 25, budget: "$900K", location: "Floor 1", status: "active" },
    { name: "Legal", code: "LGL", head: "Michael Scott", head_count: 8, budget: "$350K", location: "Floor 2", status: "active" },
  ].map((d) => ({ id: randomUUID(), ...d }));
  insertMany("departments", ["id", "name", "code", "head", "head_count", "budget", "location", "status"], rows);
}

function seedLocations() {
  if (!tableIsEmpty("locations")) return;
  const rows = [
    { name: "HQ - San Francisco", address: "123 Market St", city: "San Francisco", country: "USA", type: "office", capacity: 300, manager: "Jordan Mitchell", status: "active" },
    { name: "New York HQ", address: "456 Broadway", city: "New York", country: "USA", type: "office", capacity: 150, manager: "Amanda Foster", status: "active" },
    { name: "London Office", address: "10 King William St", city: "London", country: "UK", type: "office", capacity: 80, manager: "Omar Haddad", status: "active" },
    { name: "Austin Office", address: "200 Congress Ave", city: "Austin", country: "USA", type: "office", capacity: 60, manager: "Linda Thompson", status: "active" },
    { name: "Singapore Office", address: "1 Raffles Place", city: "Singapore", country: "Singapore", type: "office", capacity: 50, manager: "Yuki Tanaka", status: "active" },
    { name: "Central Warehouse", address: "789 Industrial Blvd", city: "Dallas", country: "USA", type: "warehouse", capacity: 1000, manager: "Robert Kim", status: "active" },
    { name: "US-West Data Center", address: "100 Cloud Ave", city: "Portland", country: "USA", type: "datacenter", capacity: 500, manager: "Emily Zhang", status: "active" },
    { name: "EU Data Center", address: "50 Server Lane", city: "Frankfurt", country: "Germany", type: "datacenter", capacity: 400, manager: "David Rodriguez", status: "active" },
    { name: "Remote Workers", address: "—", city: "Various", country: "Global", type: "remote", capacity: 200, manager: "Amanda Foster", status: "active" },
  ].map((l) => ({ id: randomUUID(), ...l }));
  insertMany("locations", ["id", "name", "address", "city", "country", "type", "capacity", "manager", "status"], rows);
}

function seedVendors() {
  if (!tableIsEmpty("vendors")) return;
  const rows = [
    { name: "Dell Technologies", category: "Hardware", contact_person: "Karen Douglas", email: "sales@dell.com", phone: "+1-800-999-3355", total_orders: 156, total_spend_cents: 120000000, rating: 4.8, status: "preferred", contract_end: "2025-12-31" },
    { name: "HP Enterprise", category: "Hardware", contact_person: "Frank Ortiz", email: "enterprise@hp.com", phone: "+1-800-474-6836", total_orders: 89, total_spend_cents: 68000000, rating: 4.5, status: "active", contract_end: "2025-09-15" },
    { name: "Cisco Systems", category: "Networking", contact_person: "Rachel Adams", email: "partners@cisco.com", phone: "+1-800-553-6387", total_orders: 42, total_spend_cents: 45000000, rating: 4.7, status: "preferred", contract_end: "2026-03-01" },
    { name: "Microsoft", category: "Software", contact_person: "Steven Cole", email: "licensing@microsoft.com", phone: "+1-800-642-7676", total_orders: 12, total_spend_cents: 32000000, rating: 4.6, status: "active", contract_end: "2025-11-30" },
    { name: "Lenovo", category: "Hardware", contact_person: "Grace Liu", email: "business@lenovo.com", phone: "+1-855-253-6686", total_orders: 67, total_spend_cents: 52000000, rating: 4.3, status: "active", contract_end: "2025-08-20" },
    { name: "CDW", category: "Reseller", contact_person: "Anthony Reid", email: "accounts@cdw.com", phone: "+1-800-839-4239", total_orders: 203, total_spend_cents: 89000000, rating: 4.4, status: "preferred", contract_end: "2026-01-15" },
    { name: "Palo Alto Networks", category: "Security", contact_person: "Michelle Grant", email: "sales@paloaltonetworks.com", phone: "+1-866-320-4788", total_orders: 18, total_spend_cents: 28000000, rating: 4.9, status: "active", contract_end: "2025-10-01" },
    { name: "APC by Schneider Electric", category: "Infrastructure", contact_person: "Louis Bennett", email: "support@apc.com", phone: "+1-800-800-4272", total_orders: 34, total_spend_cents: 15000000, rating: 4.2, status: "inactive", contract_end: "2024-12-31" },
  ].map((v) => ({ id: randomUUID(), ...v }));
  insertMany(
    "vendors",
    ["id", "name", "category", "contact_person", "email", "phone", "total_orders", "total_spend_cents", "rating", "status", "contract_end"],
    rows,
  );
}

const ASSET_CATALOG = {
  Laptop: [
    { make: "Apple", model: 'MacBook Pro 14"' },
    { make: "Dell", model: "Latitude 7440" },
    { make: "Lenovo", model: "ThinkPad X1 Carbon" },
    { make: "HP", model: "EliteBook 840" },
  ],
  Desktop: [
    { make: "Apple", model: "Mac Studio" },
    { make: "Dell", model: "OptiPlex 7010" },
    { make: "HP", model: "EliteDesk 800" },
  ],
  Monitor: [
    { make: "Dell", model: "UltraSharp U2723QE" },
    { make: "LG", model: "27UP850" },
    { make: "Samsung", model: "ViewFinity S8" },
  ],
  Server: [
    { make: "Dell", model: "PowerEdge R750" },
    { make: "HPE", model: "ProLiant DL380" },
  ],
  Network: [
    { make: "Cisco", model: "Catalyst 9300" },
    { make: "Ubiquiti", model: "UniFi Dream Machine Pro" },
  ],
  Printer: [{ make: "HP", model: "LaserJet Enterprise M611" }],
  Mobile: [
    { make: "Apple", model: "iPhone 15 Pro" },
    { make: "Samsung", model: "Galaxy S24" },
  ],
  Peripheral: [{ make: "Logitech", model: "MX Master 3S" }],
  Tablet: [{ make: "Apple", model: 'iPad Pro 12.9"' }],
  Storage: [{ make: "Synology", model: "DiskStation DS1522+" }],
};
const TAG_PREFIX = {
  Laptop: "LT", Desktop: "DT", Monitor: "MN", Server: "SV", Network: "NW",
  Printer: "PR", Mobile: "MB", Peripheral: "PH", Tablet: "TB", Storage: "ST",
};
const LOCATIONS = ["New York HQ - Floor 3", "San Francisco - Floor 2", "London Office", "Singapore Office", "Austin Office", "US-West Data Center", "Remote", "Central Warehouse"];
const DEPARTMENTS = ["IT Operations", "Engineering", "Finance", "Human Resources", "Sales", "Marketing", "Support", "Legal"];
const SUPPLIERS = ["CDW", "Dell Technologies", "HP Enterprise", "Lenovo", "Amazon Business"];

let assetSeq = 1;
function nextAssetTag(category) {
  return `${TAG_PREFIX[category]}-${(1000 + assetSeq++).toString()}`;
}

let assetRows = [];

function seedAssets() {
  if (!tableIsEmpty("assets")) return;
  const assignees = ["Sarah Chen", "Marcus Williams", "Priya Patel", "David Rodriguez", "Diego Alvarez", "Emily Zhang", "Nina Okafor", "Omar Haddad"];
  const statusCycle = ["in-use", "in-use", "in-use", "available", "in-repair", "maintenance", "retired"];
  const conditionCycle = ["new", "good", "good", "fair", "poor"];

  const specs = [];
  let i = 0;
  for (const [category, models] of Object.entries(ASSET_CATALOG)) {
    for (const spec of models) {
      for (let copy = 0; copy < 3; copy++) {
        specs.push({ category, ...spec, i: i++ });
      }
    }
  }

  const rows = specs.map((spec, idx) => {
    const status = statusCycle[idx % statusCycle.length];
    const ageDays = 60 + (idx % 20) * 45;
    const assignee = status === "in-use" ? assignees[idx % assignees.length] : null;
    const id = randomUUID();
    const assetTag = nextAssetTag(spec.category);
    const purchaseDate = daysAgo(ageDays);
    const warrantyExpiry = daysFromNow(ageDays > 730 ? -60 : 730 - ageDays);
    const row = {
      id,
      asset_tag: assetTag,
      name: `${spec.make} ${spec.model}`,
      category: spec.category,
      manufacturer: spec.make,
      model: spec.model,
      serial_number: `SN${(100000 + idx * 37).toString()}${String.fromCharCode(65 + (idx % 26))}`,
      status,
      condition: conditionCycle[idx % conditionCycle.length],
      assigned_to_id: assignee ? u(assignee) : null,
      assigned_to_name: assignee,
      assigned_to_avatar_url: null,
      location: LOCATIONS[idx % LOCATIONS.length],
      department: DEPARTMENTS[idx % DEPARTMENTS.length],
      purchase_date: purchaseDate,
      warranty_expiry: warrantyExpiry,
      supplier: SUPPLIERS[idx % SUPPLIERS.length],
      notes: null,
      created_at: purchaseDate,
      updated_at: daysAgo(idx % 20),
    };
    return row;
  });

  insertMany(
    "assets",
    ["id", "asset_tag", "name", "category", "manufacturer", "model", "serial_number", "status", "condition", "assigned_to_id", "assigned_to_name", "assigned_to_avatar_url", "location", "department", "purchase_date", "warranty_expiry", "supplier", "notes", "created_at", "updated_at"],
    rows,
  );
  assetRows = rows;
}

function seedInventory() {
  if (!tableIsEmpty("inventory_items")) return;
  const items = [
    { name: "USB-C Charger 96W", category: "Chargers", warehouse: "Central Warehouse", qty: 8, reorder: 20 },
    { name: "HDMI Cable 2m", category: "Cables", warehouse: "Central Warehouse", qty: 145, reorder: 30 },
    { name: "Ethernet Cable Cat6 3m", category: "Cables", warehouse: "Central Warehouse", qty: 210, reorder: 40 },
    { name: "Wireless Mouse", category: "Peripherals", warehouse: "SF Storage", qty: 62, reorder: 20 },
    { name: "Mechanical Keyboard", category: "Peripherals", warehouse: "SF Storage", qty: 5, reorder: 15 },
    { name: "USB-C Dock Station", category: "Docks", warehouse: "NY Storage", qty: 34, reorder: 15 },
    { name: 'Laptop Sleeve 14"', category: "Accessories", warehouse: "NY Storage", qty: 0, reorder: 25 },
    { name: "Webcam 1080p", category: "Peripherals", warehouse: "SF Storage", qty: 41, reorder: 15 },
    { name: "Headset USB", category: "Audio", warehouse: "SF Storage", qty: 27, reorder: 20 },
    { name: "SSD 1TB NVMe", category: "Storage", warehouse: "Central Warehouse", qty: 58, reorder: 25 },
    { name: "RAM 16GB DDR5", category: "Components", warehouse: "Central Warehouse", qty: 12, reorder: 20 },
    { name: "Power Strip 6-outlet", category: "Power", warehouse: "NY Storage", qty: 76, reorder: 20 },
    { name: "Monitor Arm Dual", category: "Accessories", warehouse: "SF Storage", qty: 19, reorder: 10 },
    { name: "USB Flash Drive 128GB", category: "Storage", warehouse: "Central Warehouse", qty: 93, reorder: 30 },
    { name: "Network Switch 8-port", category: "Networking", warehouse: "Central Warehouse", qty: 14, reorder: 8 },
    { name: "Toner Cartridge Black", category: "Printing", warehouse: "NY Storage", qty: 6, reorder: 15 },
  ];
  const rows = items.map((it, i) => {
    const status = it.qty === 0 ? "out-of-stock" : it.qty <= it.reorder ? "low-stock" : "in-stock";
    return {
      id: randomUUID(),
      sku: `SKU-${(4000 + i).toString()}`,
      name: it.name,
      category: it.category,
      quantity: it.qty,
      reorder_level: it.reorder,
      location: `Aisle ${1 + (i % 12)}-${String.fromCharCode(65 + (i % 6))}`,
      warehouse: it.warehouse,
      supplier: SUPPLIERS[i % SUPPLIERS.length],
      status,
      last_restocked: daysAgo(5 + i * 3),
      updated_at: daysAgo(i % 10),
    };
  });
  insertMany(
    "inventory_items",
    ["id", "sku", "name", "category", "quantity", "reorder_level", "location", "warehouse", "supplier", "status", "last_restocked", "updated_at"],
    rows,
  );
}

function seedIssues() {
  if (!tableIsEmpty("device_issues")) return;
  if (assetRows.length === 0) return;
  const holders = ["Sarah Chen", "Priya Patel", "Diego Alvarez", "Nina Okafor", "Omar Haddad", "Yuki Tanaka"];
  const statuses = ["issued", "returned", "overdue", "pending", "issued", "returned"];
  const rows = Array.from({ length: 18 }).map((_, i) => {
    const asset = assetRows[i % assetRows.length];
    const holderName = holders[i % holders.length];
    const status = statuses[i % statuses.length];
    const issuedDays = 20 + i * 6;
    const dueDays = issuedDays - 40;
    return {
      id: randomUUID(),
      reference: `ISS-${(2400 + i).toString()}`,
      asset_tag: asset.asset_tag,
      asset_name: asset.name,
      issued_to_id: u(holderName),
      issued_to_name: holderName,
      issued_to_avatar_url: null,
      issued_to_department: DEPARTMENTS[i % DEPARTMENTS.length],
      issued_by: "IT Service Desk",
      issue_date: daysAgo(issuedDays),
      due_date: daysAgo(dueDays),
      return_date: status === "returned" ? daysAgo(Math.max(0, issuedDays - 10)) : null,
      status,
      condition: "good",
      notes: null,
    };
  });
  insertMany(
    "device_issues",
    ["id", "reference", "asset_tag", "asset_name", "issued_to_id", "issued_to_name", "issued_to_avatar_url", "issued_to_department", "issued_by", "issue_date", "due_date", "return_date", "status", "condition", "notes"],
    rows,
  );
}

function seedMaintenance() {
  if (!tableIsEmpty("maintenance_tasks")) return;
  if (assetRows.length === 0) return;
  const techs = ["Marcus Williams", "Emily Zhang", "David Rodriguez", "Nina Okafor", "Omar Haddad"];
  const titles = [
    "Quarterly hardware inspection", "Firmware upgrade", "Thermal cleaning & fan replacement",
    "Battery health check", "OS patch & security update", "Disk health diagnostics",
    "Network switch reconfiguration", "Preventive server maintenance",
  ];
  const types = ["preventive", "corrective", "inspection"];
  const priorities = ["low", "medium", "high", "critical"];
  const vendors = ["OnSite Tech", "Dell ProSupport", "Internal Team", "HP Care"];
  const rows = Array.from({ length: 20 }).map((_, i) => {
    const asset = assetRows[(i * 3) % assetRows.length];
    const tech = techs[i % techs.length];
    const scheduledOffset = i % 2 === 0 ? -(5 + i) : 5 + i;
    const isPast = scheduledOffset < 0;
    const status = isPast ? (i % 4 === 0 ? "overdue" : "completed") : (i % 3 === 0 ? "in-progress" : "scheduled");
    return {
      id: randomUUID(),
      reference: `MNT-${(5100 + i).toString()}`,
      asset_tag: asset.asset_tag,
      asset_name: asset.name,
      title: titles[i % titles.length],
      type: types[i % types.length],
      status,
      priority: priorities[i % priorities.length],
      assigned_to_id: u(tech),
      assigned_to_name: tech,
      assigned_to_avatar_url: null,
      scheduled_date: daysFromNow(scheduledOffset),
      completed_date: status === "completed" ? daysFromNow(scheduledOffset + 1) : null,
      vendor: vendors[i % vendors.length],
      description: "Routine service performed according to the maintenance policy and manufacturer guidelines.",
    };
  });
  insertMany(
    "maintenance_tasks",
    ["id", "reference", "asset_tag", "asset_name", "title", "type", "status", "priority", "assigned_to_id", "assigned_to_name", "assigned_to_avatar_url", "scheduled_date", "completed_date", "vendor", "description"],
    rows,
  );
}

function seedRepairs() {
  if (!tableIsEmpty("repair_tickets")) return;
  if (assetRows.length === 0) return;
  const reporters = ["Priya Patel", "Diego Alvarez", "Yuki Tanaka", "Michael Scott"];
  const techs = ["Marcus Williams", "David Rodriguez", "Omar Haddad"];
  const issues = [
    "Screen flickering intermittently", "Won't power on", "Overheating under load",
    "Keyboard keys unresponsive", "Battery not charging", "Fan making loud noise",
    "Cracked display panel", "Storage drive failure",
  ];
  const statuses = ["reported", "diagnosing", "awaiting-parts", "in-repair", "repaired", "unrepairable"];
  const priorities = ["low", "medium", "high", "critical"];
  const vendors = ["Internal Repair Lab", "Dell ProSupport", "Apple Business"];
  const rows = Array.from({ length: 16 }).map((_, i) => {
    const asset = assetRows[(i * 5) % assetRows.length];
    const status = statuses[i % statuses.length];
    const resolved = status === "repaired" || status === "unrepairable";
    const reportedDays = 5 + i * 4;
    return {
      id: randomUUID(),
      ticket_number: `RPR-${(7300 + i).toString()}`,
      asset_tag: asset.asset_tag,
      asset_name: asset.name,
      issue_summary: issues[i % issues.length],
      reported_by_id: u(reporters[i % reporters.length]),
      reported_by_name: reporters[i % reporters.length],
      reported_by_avatar_url: null,
      assigned_technician_id: status === "reported" ? null : u(techs[i % techs.length]),
      assigned_technician_name: status === "reported" ? null : techs[i % techs.length],
      assigned_technician_avatar_url: null,
      status,
      priority: priorities[i % priorities.length],
      reported_at: daysAgo(reportedDays),
      resolved_at: resolved ? daysAgo(Math.max(0, reportedDays - 3)) : null,
      vendor: vendors[i % vendors.length],
      sla_hours: [24, 48, 72, 96][i % 4],
    };
  });
  insertMany(
    "repair_tickets",
    ["id", "ticket_number", "asset_tag", "asset_name", "issue_summary", "reported_by_id", "reported_by_name", "reported_by_avatar_url", "assigned_technician_id", "assigned_technician_name", "assigned_technician_avatar_url", "status", "priority", "reported_at", "resolved_at", "vendor", "sla_hours"],
    rows,
  );
}

let sparePartRows = [];

function seedSpareParts() {
  if (!tableIsEmpty("spare_parts")) return;
  const parts = [
    { name: "Laptop Battery (Li-Ion)", category: "Power", qty: 34, reorder: 10 },
    { name: 'LCD Panel 14"', category: "Display", qty: 6, reorder: 8 },
    { name: "SSD 512GB", category: "Storage", qty: 45, reorder: 15 },
    { name: "Cooling Fan Assembly", category: "Cooling", qty: 22, reorder: 10 },
    { name: "Keyboard Module", category: "Input", qty: 0, reorder: 8 },
    { name: "RAM Module 8GB", category: "Memory", qty: 60, reorder: 20 },
    { name: "Power Adapter 65W", category: "Power", qty: 40, reorder: 15 },
    { name: "Wi-Fi Card M.2", category: "Networking", qty: 15, reorder: 10 },
    { name: "Hinge Set", category: "Mechanical", qty: 18, reorder: 8 },
    { name: "Trackpad Assembly", category: "Input", qty: 9, reorder: 8 },
  ];
  const compat = ['MacBook Pro 14"', "Latitude 7440", "ThinkPad X1 Carbon", "EliteBook 840"];
  const rows = parts.map((p, i) => ({
    id: randomUUID(),
    part_number: `PN-${(9100 + i).toString()}`,
    name: p.name,
    category: p.category,
    compatible_with: JSON.stringify([compat[i % compat.length], compat[(i + 1) % compat.length]]),
    quantity: p.qty,
    reorder_level: p.reorder,
    supplier: "Parts Direct",
    location: `Bin ${String.fromCharCode(65 + (i % 6))}-${1 + i}`,
    status: p.qty === 0 ? "out-of-stock" : p.qty <= p.reorder ? "low-stock" : "in-stock",
    updated_at: daysAgo(i * 2),
  }));
  insertMany(
    "spare_parts",
    ["id", "part_number", "name", "category", "compatible_with", "quantity", "reorder_level", "supplier", "location", "status", "updated_at"],
    rows,
  );
  sparePartRows = rows;
}

let nvrRows = [];

function seedNvrsAndCameras() {
  if (tableIsEmpty("nvrs")) {
    const defs = [
      { name: "NVR-CORE-01", manufacturer: "Hikvision", model: "DS-9664NI-I8", channels: 16, location: "Server Room A", storageTb: 32, status: "online" },
      { name: "NVR-CORE-02", manufacturer: "Dahua", model: "NVR608-64-4KS2", channels: 16, location: "Server Room A", storageTb: 48, status: "online" },
      { name: "NVR-WEST-01", manufacturer: "Axis", model: "S3016", channels: 8, location: "West Wing IDF", storageTb: 16, status: "online" },
      { name: "NVR-DOCK-01", manufacturer: "Ubiquiti", model: "UNVR-Pro", channels: 12, location: "Loading Dock", storageTb: 24, status: "degraded" },
    ];
    const rows = defs.map((d, i) => ({
      id: `nvr-${(i + 1).toString().padStart(2, "0")}`,
      name: d.name,
      manufacturer: d.manufacturer,
      model: d.model,
      location: d.location,
      ip_address: `10.20.0.${10 + i}`,
      status: d.status,
      channels_total: d.channels,
      storage_total_tb: d.storageTb,
      recording_retention_days: 30,
      firmware_version: "v4.2.10",
      installed_date: daysAgo(400 + i * 30),
    }));
    insertMany(
      "nvrs",
      ["id", "name", "manufacturer", "model", "location", "ip_address", "status", "channels_total", "storage_total_tb", "recording_retention_days", "firmware_version", "installed_date"],
      rows,
    );
    nvrRows = rows;
  } else {
    nvrRows = db.prepare("SELECT * FROM nvrs").all();
  }

  if (!tableIsEmpty("cctv_cameras")) return;
  const zones = ["Main Entrance", "Parking Lot", "Server Room", "Reception", "Warehouse", "Loading Dock", "Corridor 2F", "Cafeteria"];
  const statuses = ["online", "recording", "recording", "online", "offline", "maintenance"];
  const rows = Array.from({ length: 16 }).map((_, i) => {
    const nvr = nvrRows[i % nvrRows.length];
    const status = statuses[i % statuses.length];
    return {
      id: randomUUID(),
      name: `CAM-${(i + 1).toString().padStart(2, "0")}`,
      location: `${zones[i % zones.length]} ${i % 2 === 0 ? "North" : "South"}`,
      zone: zones[i % zones.length],
      ip_address: `10.20.${1 + (i % 8)}.${10 + i}`,
      model: "Axis P3268-LV",
      resolution: "4K UHD",
      status,
      recording: status === "recording" ? 1 : 0,
      storage_used_gb: 500 + i * 40,
      storage_total_gb: 2000,
      last_ping: status === "offline" ? daysAgo(1) : now(),
      installed_date: daysAgo(300 + i * 10),
      firmware_version: "v3.4.2",
      nvr_id: nvr ? nvr.id : null,
    };
  });
  insertMany(
    "cctv_cameras",
    ["id", "name", "location", "zone", "ip_address", "model", "resolution", "status", "recording", "storage_used_gb", "storage_total_gb", "last_ping", "installed_date", "firmware_version", "nvr_id"],
    rows,
  );
}

function seedUpgrades() {
  if (!tableIsEmpty("device_upgrades")) return;
  if (assetRows.length === 0) return;
  const upgradable = assetRows.filter((a) => ["Laptop", "Desktop", "Server", "Storage"].includes(a.category));
  const specs = [
    { type: "memory", title: "RAM upgrade", from: "16 GB", to: "32 GB" },
    { type: "storage", title: "SSD upgrade", from: "512 GB SSD", to: "1 TB NVMe SSD" },
    { type: "os", title: "OS upgrade", from: "Windows 10", to: "Windows 11 Pro" },
    { type: "firmware", title: "Firmware / BIOS update", from: "v2.3.1", to: "v2.7.0" },
  ];
  const techs = ["Marcus Williams", "David Rodriguez", "Emily Zhang"];
  const rows = Array.from({ length: 12 }).map((_, i) => {
    const asset = upgradable[i % Math.max(upgradable.length, 1)] ?? assetRows[i];
    const spec = specs[i % specs.length];
    const tech = techs[i % techs.length];
    return {
      id: randomUUID(),
      asset_id: asset.id,
      asset_tag: asset.asset_tag,
      asset_name: asset.name,
      type: spec.type,
      title: spec.title,
      description: `${spec.title} performed to improve device performance.`,
      from_spec: spec.from,
      to_spec: spec.to,
      performed_by_id: u(tech),
      performed_by_name: tech,
      performed_at: daysAgo(20 + i * 15),
    };
  });
  insertMany(
    "device_upgrades",
    ["id", "asset_id", "asset_tag", "asset_name", "type", "title", "description", "from_spec", "to_spec", "performed_by_id", "performed_by_name", "performed_at"],
    rows,
  );
}

function seedPartInstallations() {
  if (!tableIsEmpty("part_installations")) return;
  if (assetRows.length === 0 || sparePartRows.length === 0) return;
  const techs = ["Marcus Williams", "David Rodriguez"];
  const rows = Array.from({ length: 10 }).map((_, i) => {
    const part = sparePartRows[i % sparePartRows.length];
    const asset = assetRows[(i * 7) % assetRows.length];
    const tech = techs[i % techs.length];
    return {
      id: randomUUID(),
      part_id: part.id,
      part_number: part.part_number,
      part_name: part.name,
      asset_id: asset.id,
      asset_tag: asset.asset_tag,
      asset_name: asset.name,
      quantity: 1 + (i % 2),
      installed_by_id: u(tech),
      installed_by_name: tech,
      installed_at: daysAgo(10 + i * 12),
      repair_ticket_number: i % 2 === 0 ? `RPR-${7300 + i}` : null,
    };
  });
  insertMany(
    "part_installations",
    ["id", "part_id", "part_number", "part_name", "asset_id", "asset_tag", "asset_name", "quantity", "installed_by_id", "installed_by_name", "installed_at", "repair_ticket_number"],
    rows,
  );
}

function seedSoftwareLicenses() {
  if (!tableIsEmpty("software_licenses")) return;
  const licenses = [
    { name: "Microsoft 365 E3", vendor: "Microsoft", type: "subscription", seats: 200, used: 178, costYear: 7200000, status: "active", category: "Productivity" },
    { name: "Adobe Creative Cloud", vendor: "Adobe", type: "subscription", seats: 50, used: 48, costYear: 3960000, status: "expiring", category: "Design" },
    { name: "Slack Business+", vendor: "Salesforce", type: "subscription", seats: 250, used: 210, costYear: 3150000, status: "active", category: "Communication" },
    { name: "Jira Software Cloud", vendor: "Atlassian", type: "subscription", seats: 100, used: 95, costYear: 1440000, status: "active", category: "Project Mgmt" },
    { name: "AutoCAD 2024", vendor: "Autodesk", type: "perpetual", seats: 15, used: 18, costYear: 2250000, status: "over-deployed", category: "Engineering" },
    { name: "Zoom Enterprise", vendor: "Zoom", type: "subscription", seats: 300, used: 195, costYear: 5400000, status: "active", category: "Communication" },
    { name: "GitHub Enterprise", vendor: "GitHub", type: "subscription", seats: 80, used: 72, costYear: 1680000, status: "expiring", category: "Development" },
  ];
  const rows = licenses.map((l, i) => ({
    id: randomUUID(),
    name: l.name,
    vendor: l.vendor,
    license_type: l.type,
    license_key: `${l.name.slice(0, 3).toUpperCase()}-****-****-${(1000 + i * 111)}`,
    total_seats: l.seats,
    used_seats: l.used,
    purchase_date: daysAgo(200 + i * 20),
    expiry_date: l.type === "perpetual" ? null : daysFromNow(30 + i * 10),
    cost_cents_per_year: l.costYear,
    status: l.status,
    category: l.category,
  }));
  insertMany(
    "software_licenses",
    ["id", "name", "vendor", "license_type", "license_key", "total_seats", "used_seats", "purchase_date", "expiry_date", "cost_cents_per_year", "status", "category"],
    rows,
  );
}

function seedNotifications() {
  if (!tableIsEmpty("notifications")) return;
  const rows = [
    { type: "warning", title: "Low stock alert", message: 'Laptop Sleeve 14" has dropped to 0 units — reorder needed.', read: 0, action_label: "View inventory", action_href: "/inventory" },
    { type: "maintenance", title: "Maintenance due", message: "Preventive maintenance is scheduled for this week.", read: 0, action_label: "Open task", action_href: "/maintenance" },
    { type: "security", title: "Camera offline", message: "A camera in the Server Room stopped responding recently.", read: 0, action_label: "Inspect camera", action_href: "/cctv" },
    { type: "error", title: "Repair SLA at risk", message: "A repair ticket is approaching its SLA deadline.", read: 0, action_label: "View ticket", action_href: "/repairs" },
    { type: "success", title: "Asset returned", message: "A laptop was returned in good condition.", read: 1, action_label: null, action_href: null },
    { type: "info", title: "New device assigned", message: "A new laptop was assigned to an Engineering team member.", read: 1, action_label: null, action_href: null },
    { type: "warning", title: "Warranty expiring", message: "Several assets have warranties expiring within 30 days.", read: 1, action_label: "Review assets", action_href: "/assets" },
  ].map((n, i) => ({ id: randomUUID(), ...n, created_at: daysAgo(i) }));
  insertMany(
    "notifications",
    ["id", "type", "title", "message", "read", "created_at", "action_label", "action_href"],
    rows,
  );
}

function seedActivityLog() {
  if (!tableIsEmpty("activity_log")) return;
  const entries = [
    { actor: "Sarah Chen", action: "created asset", target: "LT-1002", type: "create" },
    { actor: "James Mitchell", action: "assigned device to", target: "Priya Patel", type: "assign" },
    { actor: "Marcus Williams", action: "resolved repair ticket", target: "RPR-7305", type: "resolve" },
    { actor: "Amanda Foster", action: "updated inventory for", target: "SKU-4012", type: "update" },
    { actor: "Robert Kim", action: "completed maintenance on", target: "MNT-5110", type: "update" },
    { actor: "Emily Zhang", action: "signed in from", target: "London Office", type: "login" },
  ].map((e, i) => ({ id: randomUUID(), actor_name: e.actor, actor_avatar_url: null, action: e.action, target: e.target, timestamp: daysAgo(i), type: e.type }));
  insertMany(
    "activity_log",
    ["id", "actor_name", "actor_avatar_url", "action", "target", "timestamp", "type"],
    entries,
  );
}

function seedAuditLogs() {
  if (!tableIsEmpty("audit_logs")) return;
  const rows = [
    { actor: "Sarah Chen", action: "create", resource: "AST-0065", resourceType: "Asset", details: "Created new laptop asset", ip: "192.168.1.45" },
    { actor: "James Mitchell", action: "update", resource: "MT-0023", resourceType: "Maintenance", details: "Updated status to completed", ip: "192.168.1.12" },
    { actor: "Marcus Williams", action: "login", resource: "—", resourceType: "Session", details: "Successful login", ip: "10.0.0.88" },
    { actor: "Amanda Foster", action: "delete", resource: "USR-0018", resourceType: "User", details: "Deactivated a user account", ip: "192.168.1.22" },
    { actor: "Robert Kim", action: "export", resource: "—", resourceType: "Report", details: "Exported asset report as CSV", ip: "192.168.1.67" },
  ].map((r, i) => ({
    id: randomUUID(),
    timestamp: daysAgo(i),
    actor: r.actor,
    action: r.action,
    resource: r.resource,
    resource_type: r.resourceType,
    details: r.details,
    ip_address: r.ip,
  }));
  insertMany(
    "audit_logs",
    ["id", "timestamp", "actor", "action", "resource", "resource_type", "details", "ip_address"],
    rows,
  );
}
