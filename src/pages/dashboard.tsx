import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Boxes,
  Download,
  Gauge,
  Laptop,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card";
import { ChartCard, ChartCardSkeleton } from "@/components/shared/chart-card";
import { ChartTooltip } from "@/components/shared/chart-tooltip";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { StatusBadge } from "@/components/shared/status-badge";
import { ListSkeleton } from "@/components/shared/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAsync } from "@/hooks/use-async";
import {
  dashboardService,
  notificationService,
  repairService,
} from "@/services";
import {
  formatCompactNumber,
  formatCurrency,
  getInitials,
} from "@/lib/format";
import { toast } from "@/components/ui/sonner";

const KPI_ICONS: Record<string, React.ReactNode> = {
  "total-assets": <Laptop className="h-5 w-5" />,
  "active-assets": <ShieldCheck className="h-5 w-5" />,
  "open-repairs": <Wrench className="h-5 w-5" />,
  "low-stock": <Boxes className="h-5 w-5" />,
  utilization: <Gauge className="h-5 w-5" />,
};

export function DashboardPage() {
  const kpis = useAsync(() => dashboardService.kpis(), []);
  const assetTrend = useAsync(() => dashboardService.assetTrend(), []);
  const spendTrend = useAsync(() => dashboardService.spendTrend(), []);
  const byCategory = useAsync(() => dashboardService.assetsByCategory(), []);
  const byStatus = useAsync(() => dashboardService.assetsByStatus(), []);
  const activity = useAsync(() => notificationService.activity(), []);
  const repairs = useAsync(() => repairService.all(), []);

  const attention = (repairs.data ?? [])
    .filter((r) => r.priority === "critical" || r.priority === "high")
    .filter((r) => r.status !== "repaired" && r.status !== "unrepairable")
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your IT asset fleet, spend and operations."
      >
        <Select defaultValue="30d">
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => toast.success("Export started (demo)")}>
          <Download className="h-4 w-4" /> Export
        </Button>
      </PageHeader>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.loading || !kpis.data
          ? Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
          : kpis.data.map((metric, i) => (
              <StatCard
                key={metric.id}
                metric={metric}
                icon={KPI_ICONS[metric.id]}
                index={i}
              />
            ))}
      </div>

      {/* Trend charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {spendTrend.loading || !spendTrend.data ? (
          <ChartCardSkeleton className="lg:col-span-2" />
        ) : (
          <ChartCard
            title="IT Spend Breakdown"
            description="Procurement, maintenance and repair costs over time"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={spendTrend.data} margin={{ left: -8, right: 8, top: 8 }}>
                <defs>
                  {["procurement", "maintenance", "repairs"].map((k, i) => (
                    <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={`hsl(var(--chart-${i + 1}))`} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={`hsl(var(--chart-${i + 1}))`} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `$${formatCompactNumber(Number(v))}`}
                  width={56}
                />
                <Tooltip
                  content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />}
                  cursor={{ stroke: "hsl(var(--border))" }}
                />
                <Area type="monotone" dataKey="procurement" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#g-procurement)" />
                <Area type="monotone" dataKey="maintenance" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#g-maintenance)" />
                <Area type="monotone" dataKey="repairs" stroke="hsl(var(--chart-3))" strokeWidth={2} fill="url(#g-repairs)" />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {byCategory.loading || !byCategory.data ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard title="Assets by Category" description="Distribution of hardware types">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={byCategory.data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={2}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                >
                  {byCategory.data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {assetTrend.loading || !assetTrend.data ? (
          <ChartCardSkeleton className="lg:col-span-2" />
        ) : (
          <ChartCard
            title="Asset Acquisition vs Retirement"
            description="Units added and retired each month"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={assetTrend.data} margin={{ left: -16, right: 8, top: 8 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                <Bar dataKey="acquired" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="retired" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {byStatus.loading || !byStatus.data ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard title="Fleet Status" description="Assets by operational status">
            <div className="space-y-3 pt-2">
              {byStatus.data.map((item) => {
                const total = byStatus.data!.reduce((s, d) => s + d.value, 0);
                const pct = Math.round((item.value / total) * 100);
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <StatusBadge status={item.name} />
                      <span className="font-medium text-muted-foreground">
                        {item.value} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        )}
      </div>

      {/* Activity + attention */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/notifications">
                View all <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activity.loading || !activity.data ? (
              <ListSkeleton rows={6} />
            ) : (
              <ActivityFeed entries={activity.data.slice(0, 7)} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-warning" />
              Needs Attention
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/repairs">All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {repairs.loading ? (
              <ListSkeleton rows={4} />
            ) : attention.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing urgent right now.
              </p>
            ) : (
              attention.map((r) => (
                <Link
                  key={r.id}
                  to="/repairs"
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-[11px]">
                      {getInitials(r.assetName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.issueSummary}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.assetTag} · {r.ticketNumber}
                    </p>
                  </div>
                  <StatusBadge status={r.priority} withDot={false} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
