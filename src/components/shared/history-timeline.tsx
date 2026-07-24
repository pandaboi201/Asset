import {
  ArrowLeftRight,
  CornerDownLeft,
  MemoryStick,
  ShieldCheck,
  Wrench,
  PackagePlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { DeviceHistoryEvent, DeviceHistoryKind } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICON: Record<DeviceHistoryKind, LucideIcon> = {
  issue: ArrowLeftRight,
  return: CornerDownLeft,
  repair: ShieldCheck,
  upgrade: MemoryStick,
  maintenance: Wrench,
  part: PackagePlus,
};

const TONE: Record<DeviceHistoryKind, string> = {
  issue: "text-info bg-info/10 ring-info/20",
  return: "text-success bg-success/10 ring-success/20",
  repair: "text-warning bg-warning/15 ring-warning/20",
  upgrade: "text-chart-6 bg-chart-6/10 ring-chart-6/20",
  maintenance: "text-chart-5 bg-chart-5/10 ring-chart-5/20",
  part: "text-chart-3 bg-chart-3/10 ring-chart-3/20",
};

const KIND_LABEL: Record<DeviceHistoryKind, string> = {
  issue: "Issued",
  return: "Returned",
  repair: "Repair",
  upgrade: "Upgrade",
  maintenance: "Maintenance",
  part: "Part",
};

export function HistoryTimeline({
  events,
  className,
}: {
  events: DeviceHistoryEvent[];
  className?: string;
}) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="No history yet"
        description="Lifecycle events for this device will appear here."
      />
    );
  }

  return (
    <ol className={cn("relative space-y-1", className)}>
      {events.map((event, i) => {
        const Icon = ICON[event.kind];
        const last = i === events.length - 1;
        return (
          <li key={event.id} className="relative flex gap-4 pb-5">
            {!last && (
              <span className="absolute left-[19px] top-10 h-full w-px bg-border" />
            )}
            <div
              className={cn(
                "z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                TONE[event.kind],
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {KIND_LABEL[event.kind]}
                </span>
                {event.reference && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {event.reference}
                  </span>
                )}
                {event.status && <StatusBadge status={event.status} withDot={false} />}
              </div>
              <p className="mt-1 text-sm font-medium leading-snug">{event.title}</p>
              {event.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {event.description}
                </p>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                {formatDate(event.date)}
                {event.actor ? ` · ${event.actor}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
