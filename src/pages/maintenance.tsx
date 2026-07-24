import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarClock,
  CheckCircle2,
  MoreHorizontal,
  Plus,
  Wrench,
} from "lucide-react";

import type { MaintenanceTask } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { MiniStat } from "@/components/shared/mini-stat";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailSheet } from "@/components/shared/detail-sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAsync } from "@/hooks/use-async";
import { maintenanceService } from "@/services";
import { formatDate, getInitials } from "@/lib/format";
import { toast } from "@/components/ui/sonner";
import {
  MaintenanceFormDialog,
  type MaintenanceFormValues,
} from "./maintenance-form-dialog";

const STATUS_OPTIONS = [
  { label: "Scheduled", value: "scheduled" },
  { label: "In progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
  { label: "Overdue", value: "overdue" },
  { label: "Cancelled", value: "cancelled" },
];
const TYPE_OPTIONS = [
  { label: "Preventive", value: "preventive" },
  { label: "Corrective", value: "corrective" },
  { label: "Inspection", value: "inspection" },
];

export function MaintenancePage() {
  const { data, loading, refetch } = useAsync(() => maintenanceService.all(), []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [detail, setDetail] = useState<MaintenanceTask | null>(null);
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const tasks = data ?? [];

  const handleAdd = async (values: MaintenanceFormValues) => {
    await maintenanceService.create({
      reference: `MNT-${Date.now().toString().slice(-6)}`,
      assetTag: values.assetTag,
      assetName: values.assetName,
      title: values.title,
      type: values.type,
      status: "scheduled",
      priority: values.priority,
      assignedTo: { name: values.assignedToName },
      scheduledDate: new Date(values.scheduledDate).toISOString(),
      vendor: values.vendor || undefined,
      description: values.description,
    } as unknown as MaintenanceTask);
    toast.success(`${values.title} scheduled`);
    refetch();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (!q ||
          [t.reference, t.assetTag, t.assetName, t.title, t.assignedTo.name]
            .join(" ")
            .toLowerCase()
            .includes(q)) &&
        (!status || t.status === status) &&
        (!type || t.type === type),
    );
  }, [tasks, search, status, type]);

  const stats = useMemo(
    () => ({
      scheduled: tasks.filter((t) => t.status === "scheduled").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      overdue: tasks.filter((t) => t.status === "overdue").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks],
  );

  const complete = async (task: MaintenanceTask) => {
    await maintenanceService.update(task.id, {
      status: "completed",
      completedDate: new Date().toISOString(),
    });
    toast.success(`${task.reference} marked complete`);
    setOpen(false);
    refetch();
  };

  const columns = useMemo<ColumnDef<MaintenanceTask>[]>(
    () => [
      {
        accessorKey: "reference",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Ref" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.reference}</span>
        ),
        meta: { label: "Ref" },
      },
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Task" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.title}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.assetName} · {row.original.assetTag}
            </span>
          </div>
        ),
        meta: { label: "Task" },
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.type}
          </Badge>
        ),
        meta: { label: "Type" },
      },
      {
        accessorKey: "priority",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
        cell: ({ row }) => <StatusBadge status={row.original.priority} withDot={false} />,
        meta: { label: "Priority" },
      },
      {
        id: "assignedTo",
        accessorFn: (row) => row.assignedTo.name,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Technician" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px]">
                {getInitials(row.original.assignedTo.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{row.original.assignedTo.name}</span>
          </div>
        ),
        meta: { label: "Technician" },
      },
      {
        accessorKey: "scheduledDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Scheduled" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.scheduledDate)}
          </span>
        ),
        meta: { label: "Scheduled" },
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
                {row.original.status !== "completed" &&
                  row.original.status !== "cancelled" && (
                    <DropdownMenuItem onClick={() => complete(row.original)}>
                      <CheckCircle2 /> Mark complete
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
        title="Maintenance Management"
        description="Plan preventive and corrective maintenance to maximize asset uptime."
        icon={<Wrench className="h-5 w-5" />}
        tone="amber"
      >
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Schedule Task
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Scheduled" value={stats.scheduled} tone="info" icon={<CalendarClock className="h-5 w-5" />} loading={loading} />
        <MiniStat label="In progress" value={stats.inProgress} tone="warning" icon={<Wrench className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Overdue" value={stats.overdue} tone="destructive" icon={<CalendarClock className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Completed" value={stats.completed} tone="success" icon={<CheckCircle2 className="h-5 w-5" />} loading={loading} />
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
        emptyTitle="No maintenance tasks"
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search tasks, assets, techs..."
              className="w-full sm:w-72"
            />
            <FilterSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} allLabel="All statuses" />
            <FilterSelect value={type} onChange={setType} options={TYPE_OPTIONS} allLabel="All types" />
          </>
        }
      />

      <DetailSheet
        open={open}
        onOpenChange={setOpen}
        headerBadge={detail && <StatusBadge status={detail.status} />}
        title={detail?.title ?? ""}
        subtitle={detail ? `${detail.reference} · ${detail.assetName}` : ""}
        sections={
          detail
            ? [
                {
                  title: "Details",
                  rows: [
                    { label: "Type", value: <span className="capitalize">{detail.type}</span> },
                    { label: "Priority", value: <StatusBadge status={detail.priority} withDot={false} /> },
                    { label: "Technician", value: detail.assignedTo.name },
                    { label: "Vendor", value: detail.vendor ?? "—" },
                  ],
                },
                {
                  title: "Schedule",
                  rows: [
                    { label: "Scheduled", value: formatDate(detail.scheduledDate) },
                    { label: "Completed", value: detail.completedDate ? formatDate(detail.completedDate) : "—" },
                  ],
                },
                { title: "Description", rows: [{ label: "", value: detail.description }] },
              ]
            : []
        }
        footer={
          detail &&
          detail.status !== "completed" &&
          detail.status !== "cancelled" && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button onClick={() => complete(detail)}>
                <CheckCircle2 className="h-4 w-4" /> Mark complete
              </Button>
            </>
          )
        }
      />

      <MaintenanceFormDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAdd} />
    </div>
  );
}
