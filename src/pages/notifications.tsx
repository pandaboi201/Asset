import { useMemo } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  CircleCheck,
  Info,
  ShieldAlert,
  TriangleAlert,
  Wrench,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { AppNotification, NotificationType } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAsync } from "@/hooks/use-async";
import { notificationService } from "@/services";
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
  maintenance: "text-chart-3 bg-chart-3/10",
  security: "text-chart-5 bg-chart-5/10",
};

function NotificationRow({
  n,
  onRead,
}: {
  n: AppNotification;
  onRead: (id: string) => void | Promise<void>;
}) {
  const Icon = ICONS[n.type];
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4 transition-colors",
        !n.read && "bg-primary/[0.03] border-primary/20",
      )}
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", TONE[n.type])}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{n.title}</p>
          {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-muted-foreground/70">
            {formatRelativeTime(n.createdAt)}
          </span>
          {n.actionHref && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
              <Link to={n.actionHref}>{n.actionLabel ?? "View"}</Link>
            </Button>
          )}
        </div>
      </div>
      {!n.read && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onRead(n.id)}
          aria-label="Mark read"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function NotificationsPage() {
  const { data, loading, refetch } = useAsync(() => notificationService.all(), []);
  const activity = useAsync(() => notificationService.activity(), []);
  const items = data ?? [];

  const unread = useMemo(() => items.filter((n) => !n.read), [items]);

  const markRead = async (id: string) => {
    await notificationService.markRead(id);
    refetch();
  };
  const markAll = async () => {
    await notificationService.markAllRead();
    refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay on top of alerts, activity and system events."
        icon={<Bell className="h-5 w-5" />}
        tone="pink"
      >
        <Button variant="outline" onClick={markAll} disabled={unread.length === 0}>
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <ListSkeleton rows={6} />
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All ({items.length})</TabsTrigger>
                <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-3">
                {items.length === 0 ? (
                  <EmptyState
                    icon={Bell}
                    title="No notifications"
                    description="You'll see system alerts and updates here."
                  />
                ) : (
                  items.map((n) => (
                    <NotificationRow key={n.id} n={n} onRead={markRead} />
                  ))
                )}
              </TabsContent>
              <TabsContent value="unread" className="space-y-3">
                {unread.length === 0 ? (
                  <EmptyState
                    icon={CheckCheck}
                    title="You're all caught up"
                    description="There are no unread notifications."
                  />
                ) : (
                  unread.map((n) => (
                    <NotificationRow key={n.id} n={n} onRead={markRead} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.loading || !activity.data ? (
              <ListSkeleton rows={8} />
            ) : (
              <ActivityFeed entries={activity.data.slice(0, 12)} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
