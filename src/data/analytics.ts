import type {
  CategoryDatum,
  KpiMetric,
  TimeSeriesPoint,
} from "@/types";
import { assets } from "./assets";
import { inventory } from "./inventory";
import { repairTickets } from "./repairs";
import { maintenanceTasks } from "./maintenance";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const activeAssets = assets.filter((a) => a.status === "in-use").length;
const openRepairs = repairTickets.filter(
  (t) => t.status !== "repaired" && t.status !== "unrepairable",
).length;
const lowStock = inventory.filter((i) => i.status !== "in-stock").length;

export const kpiMetrics: KpiMetric[] = [
  {
    id: "total-assets",
    label: "Total Assets",
    value: assets.length,
    format: "number",
    delta: 4.2,
    trend: "up",
    spark: [38, 42, 45, 44, 50, 55, 58, assets.length],
  },
  {
    id: "active-assets",
    label: "Assets In Use",
    value: activeAssets,
    format: "number",
    delta: 1.5,
    trend: "up",
    spark: [30, 32, 31, 34, 33, 35, 36, activeAssets],
  },
  {
    id: "open-repairs",
    label: "Open Repairs",
    value: openRepairs,
    format: "number",
    delta: -6.1,
    trend: "down",
    spark: [22, 20, 21, 18, 17, 16, 15, openRepairs],
  },
  {
    id: "low-stock",
    label: "Low / Out of Stock",
    value: lowStock,
    format: "number",
    delta: 3.4,
    trend: "up",
    spark: [8, 9, 10, 9, 11, 12, 13, lowStock],
  },
  {
    id: "utilization",
    label: "Asset Utilization",
    value: Math.round((activeAssets / assets.length) * 100),
    format: "percent",
    delta: 0.9,
    trend: "flat",
    spark: [58, 60, 61, 59, 62, 63, 64, 65],
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const assetTrend: TimeSeriesPoint[] = MONTHS.slice(0, 9).map(
  (m, i) => ({
    date: m,
    acquired: 6 + Math.round(Math.sin(i / 2) * 3 + i * 0.6),
    retired: 2 + Math.round(Math.cos(i / 2) * 1.5 + 1),
  }),
);

function countBy<T>(items: T[], key: (item: T) => string): CategoryDatum[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value], i) => ({
      name,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
}

export const assetsByCategory: CategoryDatum[] = countBy(
  assets,
  (a) => a.category,
);

export const assetsByStatus: CategoryDatum[] = countBy(
  assets,
  (a) => a.status,
).map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] }));

export const assetsByDepartment: CategoryDatum[] = countBy(
  assets,
  (a) => a.department,
).slice(0, 6);

export const maintenanceByStatus: CategoryDatum[] = countBy(
  maintenanceTasks,
  (t) => t.status,
);
