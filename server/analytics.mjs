// Dashboard/report aggregates computed live from the SQLite database
// (replaces the old src/data/analytics.ts static derivation).

import { db } from "./crud.mjs";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

function countBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const k = keyFn(row);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
    .sort((a, b) => b.value - a.value);
}

export function getKpis() {
  const assets = db.prepare("SELECT * FROM assets").all();
  const repairs = db.prepare("SELECT * FROM repair_tickets").all();
  const inventory = db.prepare("SELECT * FROM inventory_items").all();

  const total = assets.length;
  const activeAssets = assets.filter((a) => a.status === "in-use").length;
  const openRepairs = repairs.filter((t) => t.status !== "repaired" && t.status !== "unrepairable").length;
  const lowStock = inventory.filter((i) => i.status !== "in-stock").length;
  const utilization = total ? Math.round((activeAssets / total) * 100) : 0;

  return [
    { id: "total-assets", label: "Total Assets", value: total, format: "number", delta: 4.2, trend: "up", spark: [38, 42, 45, 44, 50, 55, 58, total] },
    { id: "active-assets", label: "Assets In Use", value: activeAssets, format: "number", delta: 1.5, trend: "up", spark: [30, 32, 31, 34, 33, 35, 36, activeAssets] },
    { id: "open-repairs", label: "Open Repairs", value: openRepairs, format: "number", delta: -6.1, trend: "down", spark: [22, 20, 21, 18, 17, 16, 15, openRepairs] },
    { id: "low-stock", label: "Low / Out of Stock", value: lowStock, format: "number", delta: 3.4, trend: "up", spark: [8, 9, 10, 9, 11, 12, 13, lowStock] },
    { id: "utilization", label: "Asset Utilization", value: utilization, format: "percent", delta: 0.9, trend: "flat", spark: [58, 60, 61, 59, 62, 63, 64, utilization] },
  ];
}

export function getAssetTrend() {
  // Group real assets by purchase month for the trailing 9 months.
  const assets = db.prepare("SELECT purchase_date FROM assets").all();
  const months = [];
  const now = new Date();
  for (let i = 8; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en-US", { month: "short" }) });
  }
  const acquiredByMonth = new Map(months.map((m) => [m.key, 0]));
  for (const a of assets) {
    const d = new Date(a.purchase_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (acquiredByMonth.has(key)) acquiredByMonth.set(key, acquiredByMonth.get(key) + 1);
  }
  const retired = db.prepare("SELECT updated_at FROM assets WHERE status = 'retired'").all();
  const retiredByMonth = new Map(months.map((m) => [m.key, 0]));
  for (const r of retired) {
    const d = new Date(r.updated_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (retiredByMonth.has(key)) retiredByMonth.set(key, retiredByMonth.get(key) + 1);
  }
  return months.map((m) => ({
    date: m.label,
    acquired: acquiredByMonth.get(m.key) ?? 0,
    retired: retiredByMonth.get(m.key) ?? 0,
  }));
}

export function getAssetsByCategory() {
  const assets = db.prepare("SELECT category FROM assets").all();
  return countBy(assets, (a) => a.category);
}

export function getAssetsByStatus() {
  const assets = db.prepare("SELECT status FROM assets").all();
  return countBy(assets, (a) => a.status);
}

export function getAssetsByDepartment() {
  const assets = db.prepare("SELECT department FROM assets").all();
  return countBy(assets, (a) => a.department).slice(0, 6);
}

export function getMaintenanceByStatus() {
  const tasks = db.prepare("SELECT status FROM maintenance_tasks").all();
  return countBy(tasks, (t) => t.status);
}
