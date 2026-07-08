import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Timer,
  Wrench,
} from "lucide-react";

import type { RepairTicket } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { MiniStat } from "@/components/shared/mini-stat";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailSheet } from "@/components/shared/detail-sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAsync } from "@/hooks/use-async";
import { repairService } from "@/services";
import { formatRelativeTime, getInitials } from "@/lib/format";
import { toast } from "@/components/ui/sonner";

const STATUS_OPTIONS = [
  { label: "Reported", value: "reported" },
  { label: "Diagnosing", value: "diagnosing" },
  { label: "Awaiting parts", value: "awaiting-parts" },
  { label: "In repair", value: "in-repair" },
  { label: "Repaired", value: "repaired" },
  { label: "Unrepairable", value: "unrepairable" },
];
const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
];

export function RepairsPage() {
  const { data, loading, refetch } = useAsync(() => repairService.all(), []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [detail, setDetail] = useState<RepairTicket | null>(null);
  const [open, setOpen] = useState(false);

  const tickets = data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter(
      (t) =>
        (!q ||
          [t.ticketNumber, t.assetTag, t.assetName, t.issueSummary]
            .join(" ")
            .toLowerCase()
            .includes(q)) &&
        (!status || t.status === status) &&
        (!priority || t.priority === priority),
    );
  }, [tickets, search, status, priority]);

  const stats = useMemo(() => {
    const openTickets = tickets.filter(
      (t) => t.status !== "repaired" && t.status !== "unrepairable",
    );
    return {
      open: openTickets.length,
      critical: openTickets.filter((t) => t.priority === "critical").length,
      awaiting: tickets.filter((t) => t.status === "awaiting-parts").length,
      repaired: tickets.filter((t) => t.status === "repaired").length,
    };
  }, [tickets]);

  const resolve = async (ticket: RepairTicket) => {
    await repairService.update(ticket.id, {
      status: "repaired",
      resolvedAt: new Date().toISOString(),
    });
    toast.success(`${ticket.ticketNumber} resolved`);
    setOpen(false);
    refetch();
  };

  const columns = useMemo<ColumnDef<RepairTicket>[]>(
    () => [
      {
        accessorKey: "ticketNumber",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Ticket" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.ticketNumber}</span>
        ),
        meta: { label: "Ticket" },
      },
      {
        accessorKey: "issueSummary",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Issue" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.issueSummary}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.assetName} · {row.original.assetTag}
            </span>
          </div>
        ),
        meta: { label: "Issue" },
      },
      {
        accessorKey: "priority",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
        cell: ({ row }) => <StatusBadge status={row.original.priority} withDot={false} />,
        meta: { label: "Priority" },
      },
      {
        id: "technician",
        accessorFn: (row) => row.assignedTechnician?.name ?? "",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Technician" />,
        cell: ({ row }) => {
          const tech = row.original.assignedTechnician;
          if (!tech)
            return <span className="text-sm text-muted-foreground">Unassigned</span>;
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px]">
                  {getInitials(tech.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{tech.name}</span>
            </div>
          );
        },
        meta: { label: "Technician" },
      },
      {
        accessorKey: "reportedAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Reported" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(row.original.reportedAt)}
          </span>
        ),
        meta: { label: "Reported" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        meta: { label: "Status" },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setDetail(row.original);
                    setOpen(true);
                  }}
                >
                  View details
                </DropdownMenuItem>
                {row.original.status !== "repaired" &&
                  row.original.status !== "unrepairable" && (
                    <DropdownMenuItem onClick={() => resolve(row.original)}>
                      <CheckCircle2 /> Mark repaired
                    </DropdownMenuItem>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 48,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repair Management"
        description="Track repair tickets, technician workload and SLA compliance."
        icon={<ShieldCheck className="h-5 w-5" />}
      >
        <Button onClick={() => toast.info("New repair ticket form (demo)")}>
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Open tickets" value={stats.open} tone="info" icon={<Wrench className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Critical" value={stats.critical} tone="destructive" icon={<Timer className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Awaiting parts" value={stats.awaiting} tone="warning" icon={<Timer className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Repaired" value={stats.repaired} tone="success" icon={<CheckCircle2 className="h-5 w-5" />} loading={loading} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          setDetail(row);
          setOpen(true);
        }}
        emptyTitle="No repair tickets"
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search tickets, assets, issues..."
              className="w-full sm:w-72"
            />
            <FilterSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} allLabel="All statuses" />
            <FilterSelect value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} allLabel="All priorities" />
          </>
        }
      />

      <DetailSheet
        open={open}
        onOpenChange={setOpen}
        headerBadge={detail && <StatusBadge status={detail.status} />}
        title={detail?.issueSummary ?? ""}
        subtitle={detail ? `${detail.ticketNumber} · ${detail.assetName}` : ""}
        sections={
          detail
            ? [
                {
                  title: "Ticket",
                  rows: [
                    { label: "Priority", value: <StatusBadge status={detail.priority} withDot={false} /> },
                    { label: "Reported by", value: detail.reportedBy.name },
                    { label: "Technician", value: detail.assignedTechnician?.name ?? "Unassigned" },
                    { label: "SLA", value: `${detail.slaHours}h` },
                  ],
                },
                {
                  title: "Timeline",
                  rows: [
                    { label: "Reported", value: formatRelativeTime(detail.reportedAt) },
                    { label: "Resolved", value: detail.resolvedAt ? formatRelativeTime(detail.resolvedAt) : "—" },
                    { label: "Vendor", value: detail.vendor ?? "—" },
                  ],
                },
              ]
            : []
        }
        footer={
          detail &&
          detail.status !== "repaired" &&
          detail.status !== "unrepairable" && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button onClick={() => resolve(detail)}>
                <CheckCircle2 className="h-4 w-4" /> Mark repaired
              </Button>
            </>
          )
        }
      />
    </div>
  );
}
