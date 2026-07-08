import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Boxes,
  MoreHorizontal,
  PackageCheck,
  PackagePlus,
  PackageX,
  TriangleAlert,
} from "lucide-react";

import type { InventoryItem } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { MiniStat } from "@/components/shared/mini-stat";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailSheet } from "@/components/shared/detail-sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAsync } from "@/hooks/use-async";
import { inventoryService } from "@/services";
import {
  INVENTORY_CATEGORY_OPTIONS,
  INVENTORY_WAREHOUSE_OPTIONS,
} from "@/data/inventory";
import { formatDate } from "@/lib/format";
import { toast } from "@/components/ui/sonner";
import { InventoryFormDialog } from "@/components/forms/inventory-form-dialog";

export function InventoryPage() {
  const { data, loading, refetch } = useAsync(() => inventoryService.all(), []);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [detail, setDetail] = useState<InventoryItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const items = data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const matchesSearch =
        !q || [i.name, i.sku, i.category].join(" ").toLowerCase().includes(q);
      return (
        matchesSearch &&
        (!category || i.category === category) &&
        (!warehouse || i.warehouse === warehouse)
      );
    });
  }, [items, search, category, warehouse]);

  const stats = useMemo(
    () => ({
      skus: items.length,
      low: items.filter((i) => i.status === "low-stock").length,
      out: items.filter((i) => i.status === "out-of-stock").length,
      inStock: items.filter((i) => i.status === "in-stock").length,
    }),
    [items],
  );

  const restock = async (item: InventoryItem) => {
    const qty = item.reorderLevel * 3;
    await inventoryService.update(item.id, {
      quantity: qty,
      status: "in-stock",
      lastRestocked: new Date().toISOString(),
    });
    toast.success(`Reordered ${item.name} — stock set to ${qty}`);
    refetch();
  };

  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        accessorKey: "sku",
        header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.sku}</span>
        ),
        meta: { label: "SKU" },
      },
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Item" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.category}
            </span>
          </div>
        ),
        meta: { label: "Item" },
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Stock level" />
        ),
        cell: ({ row }) => {
          const { quantity, reorderLevel } = row.original;
          const pct = Math.min(
            100,
            Math.round((quantity / (reorderLevel * 3 || 1)) * 100),
          );
          const tone =
            row.original.status === "out-of-stock"
              ? "bg-destructive"
              : row.original.status === "low-stock"
                ? "bg-warning"
                : "bg-success";
          return (
            <div className="w-36 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium tabular-nums">{quantity}</span>
                <span className="text-muted-foreground">
                  reorder @ {reorderLevel}
                </span>
              </div>
              <Progress value={pct} indicatorClassName={tone} className="h-1.5" />
            </div>
          );
        },
        meta: { label: "Stock level" },
      },
      {
        accessorKey: "warehouse",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Warehouse" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.warehouse}
          </span>
        ),
        meta: { label: "Warehouse" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
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
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => e.stopPropagation()}
                >
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
                <DropdownMenuItem onClick={() => restock(row.original)}>
                  Reorder stock
                </DropdownMenuItem>
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
        title="Inventory Management"
        description="Monitor consumables, stock levels and reorder points across warehouses."
        icon={<Boxes className="h-5 w-5" />}
      >
        <Button onClick={() => setFormOpen(true)}>
          <PackagePlus className="h-4 w-4" /> Add Item
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total SKUs" value={stats.skus} icon={<Boxes className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Low stock" value={stats.low} tone="warning" icon={<TriangleAlert className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Out of stock" value={stats.out} tone="destructive" icon={<PackageX className="h-5 w-5" />} loading={loading} />
        <MiniStat label="In stock" value={stats.inStock} tone="success" icon={<PackageCheck className="h-5 w-5" />} loading={loading} />
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
        emptyTitle="No inventory items"
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search items or SKUs..."
              className="w-full sm:w-72"
            />
            <FilterSelect
              value={category}
              onChange={setCategory}
              options={[...INVENTORY_CATEGORY_OPTIONS]}
              allLabel="All categories"
            />
            <FilterSelect
              value={warehouse}
              onChange={setWarehouse}
              options={[...INVENTORY_WAREHOUSE_OPTIONS]}
              allLabel="All warehouses"
            />
          </>
        }
      />

      <InventoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={refetch}
      />

      <DetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        headerBadge={detail && <StatusBadge status={detail.status} />}
        title={detail?.name ?? ""}
        subtitle={detail ? `${detail.category} · ${detail.sku}` : ""}
        sections={
          detail
            ? [
                {
                  title: "Stock",
                  rows: [
                    { label: "Quantity on hand", value: detail.quantity },
                    { label: "Reorder level", value: detail.reorderLevel },
                  ],
                },
                {
                  title: "Location",
                  rows: [
                    { label: "Warehouse", value: detail.warehouse },
                    { label: "Bin", value: detail.location },
                    { label: "Supplier", value: detail.supplier },
                    { label: "Last restocked", value: formatDate(detail.lastRestocked) },
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
              <Button onClick={() => restock(detail)}>
                <PackagePlus className="h-4 w-4" /> Reorder
              </Button>
            </>
          )
        }
      />
    </div>
  );
}
