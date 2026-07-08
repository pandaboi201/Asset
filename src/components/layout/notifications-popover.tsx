import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  Bell,
  CircleCheck,
  Info,
  ShieldAlert,
  TriangleAlert,
  Wrench,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { notifications as seedNotifications } from "@/data/notifications";
import type { AppNotification, NotificationType } from "@/types";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS: Record<NotificationType, typeof Info> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: XCircle,
  maintenance: Wrench,
  security: ShieldAlert,
};

const TONE: Record<NotificationType, string> = {
  info: "text-info bg-info/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/15",
  error: "text-destructive bg-destructive/10",
  maintenance: "text-primary bg-primary/10",
  security: "text-chart-5 bg-chart-5/10",
};

export function NotificationsPopover() {
  const [items, setItems] = useState<AppNotification[]>(seedNotifications);
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {unread} new
              </span>
            )}
          </div>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={markAllRead}
          >
            Mark all read
          </Button>
        </div>
        <Separator />
        <ScrollArea className="max-h-[380px]">
          <div className="flex flex-col">
            {items.map((n) => {
              const Icon = ICONS[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() =>
                    setItems((prev) =>
                      prev.map((it) =>
                        it.id === n.id ? { ...it, read: true } : it,
                      ),
                    )
                  }
                  className="flex gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-accent/50 last:border-0"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      TONE[n.type],
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
