import type { TooltipProps } from "recharts";

import { cn } from "@/lib/utils";

interface ChartTooltipProps extends TooltipProps<number, string> {
  valueFormatter?: (value: number, name: string) => string;
  labelFormatter?: (label: string) => string;
  className?: string;
}

/** Themed tooltip content shared by all Recharts charts. */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (v) => v.toLocaleString(),
  labelFormatter,
  className,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className={cn(
        "min-w-[10rem] rounded-lg border bg-popover/95 p-3 text-xs shadow-elevated backdrop-blur-xl",
        className,
      )}
    >
      {label != null && (
        <p className="mb-1.5 font-semibold text-foreground">
          {labelFormatter ? labelFormatter(String(label)) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey as string}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="capitalize">{entry.name}</span>
            </span>
            <span className="font-medium text-foreground">
              {valueFormatter(Number(entry.value ?? 0), String(entry.name))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
