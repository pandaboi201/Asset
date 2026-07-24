import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeftRight,
  Clock,
  CornerDownLeft,
  MoreHorizontal,
  Plus,
  Undo2,
} from "lucide-react";

import type { DeviceIssue } from "@/types";
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
import { issueService } from "@/services";
import { formatDate, getInitials } from "@/lib/format";
import { toast } from "@/components/ui/sonner";
import { IssueFormDialog, type IssueFormValues } from "./issue-form-dialog";

const STATUS_OPTIONS = [
  { label: "Issued", value: "issued" },
  { label: "Returned", value: "returned" },
  { label: "Overdue", value: "overdue" },
  { label: "Pending", value: "pending" },
];

export function IssuesPage() {
  const { data, loading, refetch } = useAsync(() => issueService.all(), []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState<DeviceIssue | null>(null);
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const issues = data ?? [];

  const handleAdd = async (values: IssueFormValues) => {
    await issueService.create({
      reference: `ISS-${Date.now().toString().slice(-6)}`,
      assetTag: values.assetTag,
      assetName: values.assetName,
      issuedTo: { name: values.issuedToName, department: values.issuedToDepartment },
      issuedBy: "IT Service Desk",
      issueDate: new Date().toISOString(),
      dueDate: new Date(values.dueDate).toISOString(),
      status: "issued",
      condition: "good",
    } as unknown as DeviceIssue);
    toast.success(`${values.assetTag} issued to ${values.issuedToName}`);
    refetch();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues.filter(
      (i) =>
        (!q ||
          [i.reference, i.assetTag, i.assetName, i.issuedTo.name]
            .join(" ")
            .toLowerCase()
            .includes(q)) &&
        (!status || i.status === status),
    );
  }, [issues, search, status]);

  const stats = useMemo(
    () => ({
      issued: issues.filter((i) => i.status === "issued").length,
      overdue: issues.filter((i) => i.status === "overdue").length,
      returned: issues.filter((i) => i.status === "returned").length,
      pending: issues.filter((i) => i.status === "pending").length,
    }),
    [issues],
  );

  const markReturned = async (issue: DeviceIssue) => {
    await issueService.update(issue.id, {
      status: "returned",
      returnDate: new Date().toISOString(),
    });
    toast.success(`${issue.assetTag} marked as returned`);
    setOpen(false);
    refetch();
  };

  const columns = useMemo<ColumnDef<DeviceIssue>[]>(
    () => [
      {
        accessorKey: "reference",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Reference" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.reference}</span>
        ),
        meta: { label: "Reference" },
      },
      {
        accessorKey: "assetName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Device" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.assetName}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.assetTag}
            </span>
          </div>
        ),
        meta: { label: "Device" },
      },
      {
        id: "issuedTo",
        accessorFn: (row) => row.issuedTo.name,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Issued to" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px]">
                {getInitials(row.original.issuedTo.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm">{row.original.issuedTo.name}</span>
              <span className="text-xs text-muted-foreground">
                {row.original.issuedTo.department}
              </span>
            </div>
          </div>
        ),
        meta: { label: "Issued to" },
      },
      {
        accessorKey: "issueDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Issued" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.issueDate)}
          </span>
        ),
        meta: { label: "Issued" },
      },
      {
        accessorKey: "dueDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Due" />,
        cell: ({ row }) => {
          const overdue = row.original.status === "overdue";
          return (
            <span className={overdue ? "text-sm font-medium text-destructive" : "text-sm text-muted-foreground"}>
              {formatDate(row.original.dueDate)}
            </span>
          );
        },
        meta: { label: "Due" },
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
                {row.original.status !== "returned" && (
                  <DropdownMenuItem onClick={() => markReturned(row.original)}>
                    <Undo2 /> Mark returned
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
        title="Device Issue & Returns"
        description="Manage device check-out and check-in across the workforce."
        icon={<ArrowLeftRight className="h-5 w-5" />}
        tone="info"
      >
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Issue Device
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Currently issued" value={stats.issued} tone="info" icon={<ArrowLeftRight className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Overdue" value={stats.overdue} tone="destructive" icon={<Clock className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Pending" value={stats.pending} tone="warning" icon={<Clock className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Returned" value={stats.returned} tone="success" icon={<CornerDownLeft className="h-5 w-5" />} loading={loading} />
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
        emptyTitle="No issue records"
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search reference, device, person..."
              className="w-full sm:w-80"
            />
            <FilterSelect
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
              allLabel="All statuses"
            />
          </>
        }
      />

      <DetailSheet
        open={open}
        onOpenChange={setOpen}
        headerBadge={detail && <StatusBadge status={detail.status} />}
        title={detail?.assetName ?? ""}
        subtitle={detail ? `${detail.reference} · ${detail.assetTag}` : ""}
        headerExtra={
          detail && (
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(detail.issuedTo.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{detail.issuedTo.name}</p>
                <p className="text-xs text-muted-foreground">
                  {detail.issuedTo.department}
                </p>
              </div>
            </div>
          )
        }
        sections={
          detail
            ? [
                {
                  title: "Timeline",
                  rows: [
                    { label: "Issued on", value: formatDate(detail.issueDate) },
                    { label: "Due date", value: formatDate(detail.dueDate) },
                    {
                      label: "Returned",
                      value: detail.returnDate ? formatDate(detail.returnDate) : "—",
                    },
                    { label: "Issued by", value: detail.issuedBy },
                  ],
                },
                {
                  title: "Condition",
                  rows: [
                    {
                      label: "Recorded condition",
                      value: <StatusBadge status={detail.condition} withDot={false} />,
                    },
                  ],
                },
              ]
            : []
        }
        footer={
          detail &&
          detail.status !== "returned" && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button onClick={() => markReturned(detail)}>
                <Undo2 className="h-4 w-4" /> Mark returned
              </Button>
            </>
          )
        }
      />

      <IssueFormDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAdd} />
    </div>
  );
}
