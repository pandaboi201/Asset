import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Variant = NonNullable<BadgeProps["variant"]>;

interface StatusConfig {
  label: string;
  variant: Variant;
  dot?: string;
}

/**
 * Central mapping of every domain status value to a presentational config.
 * Keeps status styling consistent across all modules.
 */
const STATUS_MAP: Record<string, StatusConfig> = {
  // Assets
  "in-use": { label: "In Use", variant: "info", dot: "bg-info" },
  available: { label: "Available", variant: "success", dot: "bg-success" },
  "in-repair": { label: "In Repair", variant: "warning", dot: "bg-warning" },
  maintenance: { label: "Maintenance", variant: "default", dot: "bg-primary" },
  retired: { label: "Retired", variant: "secondary", dot: "bg-muted-foreground" },
  lost: { label: "Lost", variant: "destructive", dot: "bg-destructive" },

  // Conditions
  new: { label: "New", variant: "success", dot: "bg-success" },
  good: { label: "Good", variant: "info", dot: "bg-info" },
  fair: { label: "Fair", variant: "warning", dot: "bg-warning" },
  poor: { label: "Poor", variant: "destructive", dot: "bg-destructive" },

  // Inventory / stock
  "in-stock": { label: "In Stock", variant: "success", dot: "bg-success" },
  "low-stock": { label: "Low Stock", variant: "warning", dot: "bg-warning" },
  "out-of-stock": { label: "Out of Stock", variant: "destructive", dot: "bg-destructive" },

  // Issues
  issued: { label: "Issued", variant: "info", dot: "bg-info" },
  returned: { label: "Returned", variant: "success", dot: "bg-success" },
  overdue: { label: "Overdue", variant: "destructive", dot: "bg-destructive" },
  pending: { label: "Pending", variant: "warning", dot: "bg-warning" },

  // Maintenance
  scheduled: { label: "Scheduled", variant: "info", dot: "bg-info" },
  "in-progress": { label: "In Progress", variant: "warning", dot: "bg-warning" },
  completed: { label: "Completed", variant: "success", dot: "bg-success" },
  cancelled: { label: "Cancelled", variant: "secondary", dot: "bg-muted-foreground" },

  // Repairs
  reported: { label: "Reported", variant: "secondary", dot: "bg-muted-foreground" },
  diagnosing: { label: "Diagnosing", variant: "info", dot: "bg-info" },
  "awaiting-parts": { label: "Awaiting Parts", variant: "warning", dot: "bg-warning" },
  repaired: { label: "Repaired", variant: "success", dot: "bg-success" },
  unrepairable: { label: "Unrepairable", variant: "destructive", dot: "bg-destructive" },

  // Priority
  low: { label: "Low", variant: "secondary", dot: "bg-muted-foreground" },
  medium: { label: "Medium", variant: "info", dot: "bg-info" },
  high: { label: "High", variant: "warning", dot: "bg-warning" },
  critical: { label: "Critical", variant: "destructive", dot: "bg-destructive" },

  // Camera
  online: { label: "Online", variant: "success", dot: "bg-success" },
  recording: { label: "Recording", variant: "info", dot: "bg-info" },
  offline: { label: "Offline", variant: "destructive", dot: "bg-destructive" },

  // Users
  active: { label: "Active", variant: "success", dot: "bg-success" },
  invited: { label: "Invited", variant: "info", dot: "bg-info" },
  suspended: { label: "Suspended", variant: "destructive", dot: "bg-destructive" },

  // Software Licenses
  expiring: { label: "Expiring", variant: "warning", dot: "bg-warning" },
  expired: { label: "Expired", variant: "destructive", dot: "bg-destructive" },
  "over-deployed": { label: "Over-deployed", variant: "destructive", dot: "bg-destructive" },

  // NVR
  degraded: { label: "Degraded", variant: "warning", dot: "bg-warning" },
};

interface StatusBadgeProps {
  status: string;
  withDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, withDot = true, className }: StatusBadgeProps) {
  const config =
    STATUS_MAP[status] ??
    ({ label: status, variant: "secondary", dot: "bg-muted-foreground" } as StatusConfig);

  return (
    <Badge variant={config.variant} className={cn("capitalize", className)}>
      {withDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      )}
      {config.label}
    </Badge>
  );
}
