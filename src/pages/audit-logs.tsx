import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ClipboardList,
  Download,
  FileEdit,
  LogIn,
  Plus,
  Settings,
  Trash2,
  UserPlus,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/sonner";
import { formatDate, getInitials } from "@/lib/format";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: "create" | "update" | "delete" | "login" | "settings" | "export";
  resource: string;
  resourceType: string;
  details: string;
  ipAddress: string;
}

const ACTION_ICONS = {
  create: <Plus className="h-3.5 w-3.5" />,
  update: <FileEdit className="h-3.5 w-3.5" />,
  delete: <Trash2 className="h-3.5 w-3.5" />,
  login: <LogIn className="h-3.5 w-3.5" />,
  settings: <Settings className="h-3.5 w-3.5" />,
  export: <Download className="h-3.5 w-3.5" />,
};

const ACTION_COLORS = {
  create: "badge-success",
  update: "badge-info",
  delete: "badge-destructive",
  login: "bg-muted text-muted-foreground border-border",
  settings: "badge-warning",
  export: "bg-muted text-muted-foreground border-border",
};

const auditLogs: AuditLogEntry[] = [
  { id: "1", timestamp: "2025-01-15T09:23:14Z", actor: "Sarah Chen", action: "create", resource: "AST-0065", resourceType: "Asset", details: "Created new laptop asset Dell XPS 15", ipAddress: "192.168.1.45" },
  { id: "2", timestamp: "2025-01-15T09:15:02Z", actor: "James Mitchell", action: "update", resource: "MT-0023", resourceType: "Maintenance", details: "Updated status to 'completed'", ipAddress: "192.168.1.12" },
  { id: "3", timestamp: "2025-01-15T08:45:33Z", actor: "Marcus Williams", action: "login", resource: "—", resourceType: "Session", details: "Successful login from Chrome/Windows", ipAddress: "10.0.0.88" },
  { id: "4", timestamp: "2025-01-15T08:30:11Z", actor: "Amanda Foster", action: "delete", resource: "USR-0018", resourceType: "User", details: "Deactivated user account for John Reese", ipAddress: "192.168.1.22" },
  { id: "5", timestamp: "2025-01-14T17:55:00Z", actor: "Robert Kim", action: "export", resource: "—", resourceType: "Report", details: "Exported Q4 asset report as CSV", ipAddress: "192.168.1.67" },
  { id: "6", timestamp: "2025-01-14T16:42:18Z", actor: "Emily Zhang", action: "settings", resource: "—", resourceType: "Settings", details: "Updated notification preferences", ipAddress: "10.0.0.15" },
  { id: "7", timestamp: "2025-01-14T15:20:44Z", actor: "David Rodriguez", action: "create", resource: "REP-0034", resourceType: "Repair", details: "Created repair ticket for monitor flickering", ipAddress: "192.168.1.33" },
  { id: "8", timestamp: "2025-01-14T14:10:02Z", actor: "Sarah Chen", action: "update", resource: "AST-0042", resourceType: "Asset", details: "Reassigned to Marketing department", ipAddress: "192.168.1.45" },
  { id: "9", timestamp: "2025-01-14T11:30:55Z", actor: "James Mitchell", action: "create", resource: "LIC-0011", resourceType: "License", details: "Added 50 seats for Adobe CC subscription", ipAddress: "192.168.1.12" },
  { id: "10", timestamp: "2025-01-14T10:05:17Z", actor: "Linda Thompson", action: "update", resource: "INV-0089", resourceType: "Inventory", details: "Restocked USB-C cables (qty: 200)", ipAddress: "192.168.1.78" },
  { id: "11", timestamp: "2025-01-13T16:45:00Z", actor: "Marcus Williams", action: "delete", resource: "AST-0012", resourceType: "Asset", details: "Retired and disposed MacBook Pro 2019", ipAddress: "10.0.0.88" },
  { id: "12", timestamp: "2025-01-13T14:22:30Z", actor: "Amanda Foster", action: "login", resource: "—", resourceType: "Session", details: "Successful login from Safari/macOS", ipAddress: "192.168.1.22" },
];

const ACTION_OPTIONS = [
  { label: "Create", value: "create" },
  { label: "Update", value: "update" },
  { label: "Delete", value: "delete" },
  { label: "Login", value: "login" },
  { label: "Settings", value: "settings" },
  { label: "Export", value: "export" },
];

export function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return auditLogs.filter((log) => {
      const matchesSearch =
        !q ||
        log.actor.toLowerCase().includes(q) ||
        log.resource.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);
      const matchesAction = !actionFilter || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [search, actionFilter]);

  const columns = useMemo<ColumnDef<AuditLogEntry>[]>(
    () => [
      {
        accessorKey: "timestamp",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Timestamp" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDate(row.original.timestamp)}
          </span>
        ),
        meta: { label: "Timestamp" },
      },
      {
        accessorKey: "actor",
        header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px]">
                {getInitials(row.original.actor)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{row.original.actor}</span>
          </div>
        ),
        meta: { label: "User" },
      },
      {
        accessorKey: "action",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
        cell: ({ row }) => (
          <Badge variant="outline" className={`gap-1.5 capitalize ${ACTION_COLORS[row.original.action]}`}>
            {ACTION_ICONS[row.original.action]}
            {row.original.action}
          </Badge>
        ),
        meta: { label: "Action" },
      },
      {
        accessorKey: "resourceType",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Resource" />,
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">{row.original.resourceType}</p>
            <p className="font-mono text-xs text-muted-foreground">{row.original.resource}</p>
          </div>
        ),
        meta: { label: "Resource" },
      },
      {
        accessorKey: "details",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Details" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.details}</span>
        ),
        meta: { label: "Details" },
      },
      {
        accessorKey: "ipAddress",
        header: ({ column }) => <DataTableColumnHeader column={column} title="IP Address" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.ipAddress}</span>
        ),
        meta: { label: "IP Address" },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Complete audit trail of all system activity for compliance and security."
        icon={<ClipboardList className="h-5 w-5" />}
      >
        <Button variant="outline" onClick={() => toast.success("Exporting audit logs (demo)")}>
          <Download className="h-4 w-4" /> Export Logs
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={filtered}
        loading={false}
        getRowId={(row) => row.id}
        emptyTitle="No audit logs found"
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search logs..."
              className="w-full sm:w-72"
            />
            <FilterSelect
              value={actionFilter}
              onChange={setActionFilter}
              options={ACTION_OPTIONS}
              allLabel="All actions"
            />
          </>
        }
      />
    </div>
  );
}
