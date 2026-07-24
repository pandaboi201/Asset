import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Star, Store, Trash2 } from "lucide-react";

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
import { vendorService, type Vendor } from "@/services";
import { toast } from "@/components/ui/sonner";
import { VendorFormDialog, type VendorFormValues } from "./vendor-form-dialog";

const STATUS_BADGE: Record<Vendor["status"], string> = {
  preferred: "badge-info",
  active: "badge-success",
  inactive: "badge-warning",
};

export function VendorsPage() {
  const { data, loading, refetch } = useAsync(() => vendorService.all(), []);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Vendor | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [toDelete, setToDelete] = useState<Vendor | null>(null);

  const vendors = data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q),
    );
  }, [vendors, search]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (v: Vendor) => {
    setEditing(v);
    setFormOpen(true);
  };

  const handleSubmit = async (values: VendorFormValues) => {
    if (editing) {
      await vendorService.update(editing.id, values);
      toast.success("Vendor updated");
    } else {
      await vendorService.create({
        ...values,
        totalOrders: 0,
        totalSpend: "$0",
        rating: 0,
      });
      toast.success("Vendor created");
    }
    refetch();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await vendorService.remove(toDelete.id);
    toast.success(`${toDelete.name} deleted`);
    setToDelete(null);
    refetch();
  };

  const columns = useMemo<ColumnDef<Vendor>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning ring-1 ring-warning/15">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.category}</p>
            </div>
          </div>
        ),
        meta: { label: "Vendor" },
      },
      {
        accessorKey: "contactPerson",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
        cell: ({ row }) => (
          <div>
            <p className="text-sm">{row.original.contactPerson}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
        meta: { label: "Contact" },
      },
      {
        accessorKey: "totalOrders",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Orders" />,
        cell: ({ row }) => (
          <span className="text-sm font-medium tabular-nums">{row.original.totalOrders}</span>
        ),
        meta: { label: "Orders" },
      },
      {
        accessorKey: "totalSpend",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total Spend" />,
        cell: ({ row }) => (
          <span className="text-sm font-semibold">{row.original.totalSpend}</span>
        ),
        meta: { label: "Total Spend" },
      },
      {
        accessorKey: "rating",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-sm font-medium tabular-nums">{row.original.rating}</span>
          </div>
        ),
        meta: { label: "Rating" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <Badge variant="outline" className={STATUS_BADGE[row.original.status]}>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Manage suppliers, contracts and procurement relationships."
        icon={<Store className="h-5 w-5" />}
        tone="amber"
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total Vendors" value={vendors.length} icon={<Store className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Preferred" value={vendors.filter((v) => v.status === "preferred").length} tone="info" icon={<Star className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Active" value={vendors.filter((v) => v.status === "active").length} tone="success" icon={<Store className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Total Orders" value={vendors.reduce((s, v) => s + v.totalOrders, 0)} tone="warning" icon={<Store className="h-5 w-5" />} loading={loading} />
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
        emptyTitle="No vendors found"
        emptyDescription="Add your first vendor to get started."
        toolbar={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search vendors..."
            className="w-full sm:w-72"
          />
        }
      />

      <VendorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vendor={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete vendor?"
        description={`This will permanently remove ${toDelete?.name}. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />

      <DetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        headerBadge={detail && (
          <Badge variant="outline" className={STATUS_BADGE[detail.status]}>
            {detail.status}
          </Badge>
        )}
        title={detail?.name ?? ""}
        subtitle={detail ? detail.category : ""}
        sections={
          detail
            ? [
                {
                  title: "Contact",
                  rows: [
                    { label: "Contact person", value: detail.contactPerson },
                    { label: "Email", value: detail.email },
                    { label: "Phone", value: detail.phone },
                  ],
                },
                {
                  title: "Relationship",
                  rows: [
                    { label: "Total orders", value: detail.totalOrders },
                    { label: "Total spend", value: detail.totalSpend },
                    { label: "Rating", value: `${detail.rating} / 5` },
                    { label: "Contract end", value: detail.contractEnd ?? "—" },
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
