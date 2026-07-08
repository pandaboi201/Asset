import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatCompactNumber,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import type { KpiMetric } from "@/types";

function formatValue(value: number, format: KpiMetric["format"]): string {
  switch (format) {
    case "currency":
      return value >= 100000 ? `$${formatCompactNumber(value)}` : formatCurrency(value);
    case "percent":
      return formatPercent(value);
    default:
      return formatNumber(value);
  }
}

interface StatCardProps {
  metric: KpiMetric;
  icon?: React.ReactNode;
  index?: number;
}

export function StatCard({ metric, icon, index = 0 }: StatCardProps) {
  const trendColor =
    metric.trend === "up"
      ? "text-success"
      : metric.trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  const TrendIcon =
    metric.trend === "up"
      ? ArrowUpRight
      : metric.trend === "down"
        ? ArrowDownRight
        : Minus;

  const chartData = metric.spark.map((v, i) => ({ i, v }));
  const gradientId = `spark-${metric.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card className="group relative overflow-hidden p-5 transition-shadow hover:shadow-elevated">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {metric.label}
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {formatValue(metric.value, metric.format)}
            </p>
          </div>
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className={cn("flex items-center gap-1 text-xs font-semibold", trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{Math.abs(metric.delta)}%</span>
            <span className="font-normal text-muted-foreground">vs last month</span>
          </div>
          <div className="h-10 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={
                        metric.trend === "down"
                          ? "hsl(var(--destructive))"
                          : "hsl(var(--primary))"
                      }
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor={
                        metric.trend === "down"
                          ? "hsl(var(--destructive))"
                          : "hsl(var(--primary))"
                      }
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={
                    metric.trend === "down"
                      ? "hsl(var(--destructive))"
                      : "hsl(var(--primary))"
                  }
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-24" />
      </div>
    </Card>
  );
}
