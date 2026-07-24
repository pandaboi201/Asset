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
import { useAsync } from "@/hooks/use-async";
import { auditLogService, exportCsv, type AuditLogEntry } from "@/services";

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

const ACTION_OPTIONS = [
  { label: "Create", value: "create" },
  { label: "Update", value: "update" },
  { label: "Delete", value: "delete" },
  { label: "Login", value: "login" },
  { label: "Settings", value: "settings" },
  { label: "Export", value: "export" },
];

export function AuditLogsPage() {
  const { data, loading } = useAsync(() => auditLogService.all(), []);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const auditLogs = data ?? [];

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
  }, [auditLogs, search, actionFilter]);

  const handleExport = () => {
    exportCsv("audit-logs");
    toast.success("Downloading audit-logs.csv");
  };

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
        tone="pink"
      >
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export Logs
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
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
