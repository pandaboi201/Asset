import { Link } from "react-router-dom";
import {
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
  Plus,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";

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
  exportCsv,
  notificationService,
  repairService,
} from "@/services";
import { getInitials } from "@/lib/format";
import { toast } from "@/components/ui/sonner";

const KPI_ICONS: Record<string, React.ReactNode> = {
  "total-assets": <Laptop className="h-5 w-5" />,
  "active-assets": <ShieldCheck className="h-5 w-5" />,
  "open-repairs": <Wrench className="h-5 w-5" />,
  "low-stock": <Boxes className="h-5 w-5" />,
  utilization: <Gauge className="h-5 w-5" />,
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

export function DashboardPage() {
  const kpis = useAsync(() => dashboardService.kpis(), []);
  const assetTrend = useAsync(() => dashboardService.assetTrend(), []);
  const byDepartment = useAsync(
    () => dashboardService.assetsByDepartment(),
    [],
  );
  const byCategory = useAsync(() => dashboardService.assetsByCategory(), []);
  const byStatus = useAsync(() => dashboardService.assetsByStatus(), []);
  const activity = useAsync(() => notificationService.activity(), []);
  const repairs = useAsync(() => repairService.all(), []);

  const attention = (repairs.data ?? [])
    .filter((r) => r.priority === "critical" || r.priority === "high")
    .filter((r) => r.status !== "repaired" && r.status !== "unrepairable")
    .slice(0, 5);

  return (
    <div className="space-y-8">
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
        <Button
          variant="outline"
          onClick={() => {
            exportCsv("assets");
            toast.success("Downloading assets.csv");
          }}
        >
          <Download className="h-4 w-4" /> Export
        </Button>
      </PageHeader>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {[
          { label: "Add Asset", icon: Plus, href: "/assets" },
          { label: "New Repair", icon: Wrench, href: "/repairs" },
          { label: "View Reports", icon: Gauge, href: "/reports" },
        ].map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="gap-1.5 border-border/60 text-xs"
            asChild
          >
            <Link to={action.href}>
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Link>
          </Button>
        ))}
      </motion.div>

      {/* KPI grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        {kpis.loading || !kpis.data
          ? Array.from({ length: 5 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : kpis.data.map((metric, i) => (
              <StatCard
                key={metric.id}
                metric={metric}
                icon={KPI_ICONS[metric.id]}
                index={i}
              />
            ))}
      </motion.div>

      {/* Trend charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {byDepartment.loading || !byDepartment.data ? (
          <ChartCardSkeleton className="lg:col-span-2" />
        ) : (
          <ChartCard
            title="Assets by Department"
            description="How devices are allocated across teams"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={byDepartment.data}
                layout="vertical"
                margin={{ left: 24, right: 16, top: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  width={120}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {byDepartment.data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {byCategory.loading || !byCategory.data ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            title="Assets by Category"
            description="Distribution of hardware types"
          >
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={byCategory.data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                >
                  {byCategory.data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Trend charts row 2 */}
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
              <BarChart
                data={assetTrend.data}
                margin={{ left: -16, right: 8, top: 8 }}
                barGap={6}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                />
                <Bar
                  dataKey="acquired"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
                <Bar
                  dataKey="retired"
                  fill="hsl(var(--chart-4))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {byStatus.loading || !byStatus.data ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            title="Fleet Status"
            description="Assets by operational status"
          >
            <div className="space-y-3.5 pt-2">
              {byStatus.data.map((item) => {
                const total = byStatus.data!.reduce((s, d) => s + d.value, 0);
                const pct = Math.round((item.value / total) * 100);
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <StatusBadge status={item.name} />
                      <span className="font-medium tabular-nums text-muted-foreground">
                        {item.value} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{
                          duration: 0.8,
                          ease: [0.4, 0, 0.2, 1],
                          delay: 0.2,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        )}
      </div>

      {/* Activity + Needs Attention */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">
              Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/notifications">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
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

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TriangleAlert className="h-4 w-4 text-warning" />
              Needs Attention
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/repairs">All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
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
                  className="group flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-all duration-200 hover:border-border hover:bg-accent/30 hover:shadow-sm"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(r.assetName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">
                      {r.issueSummary}
                    </p>
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
