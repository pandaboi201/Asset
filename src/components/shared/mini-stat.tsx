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
}

const TONE: Record<NonNullable<MiniStatProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

export function MiniStat({
  label,
  value,
  icon,
  tone = "default",
  hint,
  loading,
}: MiniStatProps) {
  return (
    <Card className="flex items-center gap-3 p-4">
      {icon && (
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            TONE[tone],
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-16" />
        ) : (
          <p className="text-xl font-bold tracking-tight">{value}</p>
        )}
        {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  );
}
