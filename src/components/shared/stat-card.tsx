import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/format";
import type { KpiMetric } from "@/types";

function formatValue(value: number, format: KpiMetric["format"]): string {
  switch (format) {
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.07,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      <Card className="group relative overflow-hidden border-border/50 p-5 transition-all duration-300 hover:border-border hover:shadow-premium-sm">
        {/* Subtle top accent gradient */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-muted-foreground">
              {metric.label}
            </p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              {formatValue(metric.value, metric.format)}
            </p>
          </div>
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/10 transition-all duration-300 group-hover:bg-primary/12 group-hover:ring-primary/20">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3.5 flex items-end justify-between gap-3">
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold",
              trendColor,
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            <span className="tabular-nums">{Math.abs(metric.delta)}%</span>
            <span className="font-normal text-muted-foreground">
              vs last period
            </span>
          </div>
          <div className="h-10 w-24 opacity-80 transition-opacity group-hover:opacity-100">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, bottom: 0, left: 0, right: 0 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={
                        metric.trend === "down"
                          ? "hsl(var(--destructive))"
                          : "hsl(var(--primary))"
                      }
                      stopOpacity={0.35}
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
                  strokeWidth={1.5}
                  fill={`url(#${gradientId})`}
                  isAnimationActive
                  animationDuration={1200}
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
    <Card className="border-border/50 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </Card>
  );
}
