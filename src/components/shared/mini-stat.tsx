import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MiniStatProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
  hint?: string;
  loading?: boolean;
  index?: number;
}

const TONE: Record<NonNullable<MiniStatProps["tone"]>, string> = {
  default: "bg-primary/8 text-primary ring-1 ring-primary/10",
  success: "bg-success/8 text-success ring-1 ring-success/10",
  warning: "bg-warning/10 text-warning ring-1 ring-warning/10",
  destructive: "bg-destructive/8 text-destructive ring-1 ring-destructive/10",
  info: "bg-info/8 text-info ring-1 ring-info/10",
};

export function MiniStat({
  label,
  value,
  icon,
  tone = "default",
  hint,
  loading,
  index = 0,
}: MiniStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="group flex items-center gap-3.5 border-border/50 p-4 transition-all duration-200 hover:border-border hover:shadow-sm">
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
              TONE[tone],
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-16" />
          ) : (
            <p className="text-xl font-bold tracking-tight tabular-nums">
              {value}
            </p>
          )}
          {hint && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
