import {
  FilePlus2,
  PencilLine,
  Trash2,
  UserPlus,
  CheckCircle2,
  LogIn,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityLogEntry } from "@/types";

const ICON: Record<ActivityLogEntry["type"], typeof FilePlus2> = {
  create: FilePlus2,
  update: PencilLine,
  delete: Trash2,
  assign: UserPlus,
  resolve: CheckCircle2,
  login: LogIn,
};

const TONE: Record<ActivityLogEntry["type"], string> = {
  create: "text-success bg-success/10",
  update: "text-info bg-info/10",
  delete: "text-destructive bg-destructive/10",
  assign: "text-primary bg-primary/10",
  resolve: "text-success bg-success/10",
  login: "text-muted-foreground bg-muted",
};

export function ActivityFeed({
  entries,
  className,
}: {
  entries: ActivityLogEntry[];
  className?: string;
}) {
  return (
    <ol className={cn("relative space-y-1", className)}>
      {entries.map((entry, i) => {
        const Icon = ICON[entry.type];
        const last = i === entries.length - 1;
        return (
          <li key={entry.id} className="relative flex gap-3 pb-4">
            {!last && (
              <span className="absolute left-[15px] top-9 h-full w-px bg-border" />
            )}
            <div
              className={cn(
                "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                TONE[entry.type],
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm leading-snug">
                <span className="font-medium">{entry.actor.name}</span>{" "}
                <span className="text-muted-foreground">{entry.action}</span>{" "}
                <span className="font-medium">{entry.target}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatRelativeTime(entry.timestamp)}
              </p>
            </div>
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-[10px]">
                {getInitials(entry.actor.name)}
              </AvatarFallback>
            </Avatar>
          </li>
        );
      })}
    </ol>
  );
}
