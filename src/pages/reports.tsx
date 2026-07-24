import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Download, Share2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ChartCard, ChartCardSkeleton } from "@/components/shared/chart-card";
import { ChartTooltip } from "@/components/shared/chart-tooltip";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAsync } from "@/hooks/use-async";
import { dashboardService, exportCsv } from "@/services";
import { toast } from "@/components/ui/sonner";

const AXIS = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const CHART_COLORS = [1, 2, 3, 4, 5].map((n) => `hsl(var(--chart-${n}))`);

const utilizationData = [
  { name: "Utilized", value: 65, fill: "hsl(var(--chart-1))" },
  { name: "Idle", value: 20, fill: "hsl(var(--chart-2))" },
  { name: "Servicing", value: 15, fill: "hsl(var(--chart-4))" },
];

export function ReportsPage() {
  const assetTrendQ = useAsync(() => dashboardService.assetTrend(), []);
  const byCategoryQ = useAsync(() => dashboardService.assetsByCategory(), []);
  const byDepartmentQ = useAsync(() => dashboardService.assetsByDepartment(), []);
  const byStatusQ = useAsync(() => dashboardService.assetsByStatus(), []);
  const maintenanceByStatusQ = useAsync(
    () => dashboardService.maintenanceByStatus(),
    [],
  );

  const assetTrend = assetTrendQ.data ?? [];
  const assetsByCategory = byCategoryQ.data ?? [];
  const assetsByDepartment = byDepartmentQ.data ?? [];
  const assetsByStatus = byStatusQ.data ?? [];
  const maintenanceByStatus = maintenanceByStatusQ.data ?? [];

  const slaData = assetTrend.map((d, i) => ({
    date: d.date,
    sla: 88 + Math.round(Math.sin(i) * 5 + i * 0.4),
    target: 95,
  }));

  const loading =
    assetTrendQ.loading ||
    byCategoryQ.loading ||
    byDepartmentQ.loading ||
    byStatusQ.loading ||
    maintenanceByStatusQ.loading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Deep-dive analytics across assets, finance and operations."
        icon={<BarChart3 className="h-5 w-5" />}
        tone="purple"
      >
        <Select defaultValue="90d">
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last quarter</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
            <SelectItem value="ytd">Year to date</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              toast.success("Report link copied to clipboard");
            } catch {
              toast.error("Couldn't access the clipboard in this browser");
            }
          }}
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>
        <Button
          onClick={() => {
            exportCsv("assets");
            toast.success("Downloading assets.csv");
          }}
        >
          <Download className="h-4 w-4" /> Export
        </Button>
      </PageHeader>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {loading ? (
              <ChartCardSkeleton className="lg:col-span-2" />
            ) : (
              <ChartCard
                title="Fleet Growth"
                description="Devices acquired vs retired over time"
                className="lg:col-span-2"
              >
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={assetTrend} margin={{ left: -8, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="rep-acq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rep-ret" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={AXIS} />
                    <YAxis tickLine={false} axisLine={false} tick={AXIS} width={40} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="acquired" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#rep-acq)" />
                    <Area type="monotone" dataKey="retired" stroke="hsl(var(--chart-4))" strokeWidth={2} fill="url(#rep-ret)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {loading ? (
              <ChartCardSkeleton />
            ) : (
              <ChartCard title="Asset Utilization" description="Current fleet utilization split">
                <ResponsiveContainer width="100%" height={280}>
                  <RadialBarChart
                    innerRadius="30%"
                    outerRadius="100%"
                    data={utilizationData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar background dataKey="value" cornerRadius={8} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip content={<ChartTooltip valueFormatter={(v) => `${v}%`} />} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {loading ? (
              <ChartCardSkeleton />
            ) : (
              <ChartCard title="Assets by Category" description="Hardware distribution">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={assetsByCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="hsl(var(--card))" strokeWidth={2}>
                      {assetsByCategory.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
            {loading ? (
              <ChartCardSkeleton />
            ) : (
              <ChartCard title="Assets by Department" description="Allocation across teams">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={assetsByDepartment} layout="vertical" margin={{ left: 24, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={AXIS} width={110} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                      {assetsByDepartment.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        </TabsContent>

        {/* Assets */}
        <TabsContent value="assets" className="space-y-4">
          {loading ? (
            <ChartCardSkeleton />
          ) : (
            <ChartCard title="Acquisition vs Retirement" description="Monthly asset movement">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={assetTrend} margin={{ left: -16, right: 8, top: 8 }} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={AXIS} />
                  <YAxis tickLine={false} axisLine={false} tick={AXIS} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="acquired" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="retired" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {loading ? (
              <ChartCardSkeleton />
            ) : (
              <ChartCard title="Status Distribution" description="Operational status of the fleet">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={assetsByStatus} dataKey="value" nameKey="name" outerRadius={90} paddingAngle={2} stroke="hsl(var(--card))" strokeWidth={2}>
                      {assetsByStatus.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
            {loading ? (
              <ChartCardSkeleton />
            ) : (
              <ChartCard title="Category Allocation" description="Assets per category">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={assetsByCategory} margin={{ left: -16, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ ...AXIS, fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis tickLine={false} axisLine={false} tick={AXIS} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
                      {assetsByCategory.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        </TabsContent>

        {/* Operations */}
        <TabsContent value="operations" className="space-y-4">
          {loading ? (
            <ChartCardSkeleton />
          ) : (
            <ChartCard title="SLA Compliance" description="Repair resolution vs target SLA">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={slaData} margin={{ left: -16, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={AXIS} />
                  <YAxis domain={[80, 100]} tickLine={false} axisLine={false} tick={AXIS} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<ChartTooltip valueFormatter={(v) => `${v}%`} />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="sla" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="target" stroke="hsl(var(--chart-4))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
          {loading ? (
            <ChartCardSkeleton />
          ) : (
            <ChartCard title="Maintenance Status" description="Distribution of maintenance tasks">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={maintenanceByStatus} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ ...AXIS, fontSize: 10 }} interval={0} />
                  <YAxis tickLine={false} axisLine={false} tick={AXIS} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {maintenanceByStatus.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
