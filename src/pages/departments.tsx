import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { MiniStat } from "@/components/shared/mini-stat";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { DetailSheet } from "@/components/shared/detail-sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAsync } from "@/hooks/use-async";
import { departmentService, type Department } from "@/services";
import { toast } from "@/components/ui/sonner";
import {
  DepartmentFormDialog,
  type DepartmentFormValues,
} from "./department-form-dialog";

export function DepartmentsPage() {
  const { data, loading, refetch } = useAsync(() => departmentService.all(), []);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Department | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [toDelete, setToDelete] = useState<Department | null>(null);

  const departments = data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.head.toLowerCase().includes(q),
    );
  }, [departments, search]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (d: Department) => {
    setEditing(d);
    setFormOpen(true);
  };

  const handleSubmit = async (values: DepartmentFormValues) => {
    if (editing) {
      await departmentService.update(editing.id, values);
      toast.success("Department updated");
    } else {
      await departmentService.create(values);
      toast.success("Department created");
    }
    refetch();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await departmentService.remove(toDelete.id);
    toast.success(`${toDelete.name} deleted`);
    setToDelete(null);
    refetch();
  };

  const columns = useMemo<ColumnDef<Department>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-6/10 text-chart-6 ring-1 ring-chart-6/15">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.code}</p>
            </div>
          </div>
        ),
        meta: { label: "Department" },
      },
      {
        accessorKey: "head",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Department Head" />,
        cell: ({ row }) => <span className="text-sm">{row.original.head}</span>,
        meta: { label: "Head" },
      },
      {
        accessorKey: "headCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Employees" />,
        cell: ({ row }) => (
          <span className="text-sm font-medium tabular-nums">{row.original.headCount}</span>
        ),
        meta: { label: "Employees" },
      },
      {
        accessorKey: "assetCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Assets" />,
        cell: ({ row }) => (
          <span className="text-sm font-medium tabular-nums">{row.original.assetCount}</span>
        ),
        meta: { label: "Assets" },
      },
      {
        accessorKey: "budget",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Budget" />,
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.budget}</span>,
        meta: { label: "Budget" },
      },
      {
        accessorKey: "location",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.location}</span>
        ),
        meta: { label: "Location" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={row.original.status === "active" ? "badge-success" : "badge-warning"}
          >
            {row.original.status}
          </Badge>
        ),
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
                    setDetailOpen(true);
                  }}
                >
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openEdit(row.original)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setToDelete(row.original)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 48,
      },
    ],
    [],
  );

  const totalEmployees = departments.reduce((s, d) => s + d.headCount, 0);
  const totalAssets = departments.reduce((s, d) => s + d.assetCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage organizational departments, teams and their asset allocations."
        icon={<Building2 className="h-5 w-5" />}
        tone="purple"
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Department
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Departments" value={departments.length} icon={<Building2 className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Total Employees" value={totalEmployees} tone="info" icon={<Users className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Total Assets" value={totalAssets} tone="success" icon={<Building2 className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Active" value={departments.filter((d) => d.status === "active").length} tone="success" icon={<Building2 className="h-5 w-5" />} loading={loading} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          setDetail(row);
          setDetailOpen(true);
        }}
        emptyTitle="No departments found"
        emptyDescription="Add your first department to get started."
        toolbar={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search departments..."
            className="w-full sm:w-72"
          />
        }
      />

      <DepartmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        department={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete department?"
        description={`This will permanently remove ${toDelete?.name} from the organization. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />

      <DetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        headerBadge={detail && (
          <Badge variant="outline" className={detail.status === "active" ? "badge-success" : "badge-warning"}>
            {detail.status}
          </Badge>
        )}
        title={detail?.name ?? ""}
        subtitle={detail ? `${detail.code} · ${detail.location}` : ""}
        sections={
          detail
            ? [
                {
                  title: "Overview",
                  rows: [
                    { label: "Department head", value: detail.head },
                    { label: "Employees", value: detail.headCount },
                    { label: "Assets assigned", value: detail.assetCount },
                    { label: "Budget", value: detail.budget },
                    { label: "Location", value: detail.location },
                  ],
                },
              ]
            : []
        }
        footer={
          detail && (
            <>
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setDetailOpen(false);
                  openEdit(detail);
                }}
              >
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            </>
          )
        }
      />
    </div>
  );
}
