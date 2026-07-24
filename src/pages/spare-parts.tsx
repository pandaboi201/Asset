import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Cpu,
  MoreHorizontal,
  PackagePlus,
  PackageSearch,
  PackageX,
  Plus,
  Trash2,
  TriangleAlert,
  Boxes,
} from "lucide-react";

import type { PartInstallation, SparePart } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { MiniStat } from "@/components/shared/mini-stat";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailSheet } from "@/components/shared/detail-sheet";
import { InstallPartDialog } from "@/components/shared/install-part-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAsync } from "@/hooks/use-async";
import { partInstallationService, sparePartService } from "@/services";
import { SPARE_PART_CATEGORY_OPTIONS } from "@/data/options";
import { formatDate } from "@/lib/format";
import { toast } from "@/components/ui/sonner";
import {
  SparePartFormDialog,
  type SparePartFormValues,
} from "./spare-part-form-dialog";

const STATUS_OPTIONS = [
  { label: "In stock", value: "in-stock" },
  { label: "Low stock", value: "low-stock" },
  { label: "Out of stock", value: "out-of-stock" },
];

export function SparePartsPage() {
  const { data, loading, refetch } = useAsync(() => sparePartService.all(), []);
  const installsQ = useAsync(() => partInstallationService.all(), []);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState<SparePart | null>(null);
  const [open, setOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const parts = data ?? [];

  const handleAdd = async (values: SparePartFormValues) => {
    const status =
      values.quantity === 0
        ? "out-of-stock"
        : values.quantity <= values.reorderLevel
          ? "low-stock"
          : "in-stock";
    await sparePartService.create({
      ...values,
      compatibleWith: (values.compatibleWith ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      status,
      updatedAt: new Date().toISOString(),
    } as unknown as SparePart);
    toast.success(`${values.name} added to spare parts`);
    refetch();
  };

  const removeInstall = async (id: string) => {
    await partInstallationService.remove(id);
    toast.success("Installation record removed");
    installsQ.refetch();
  };

  /** Map of partId -> installations (which devices the part went into). */
  const installsByPart = useMemo(() => {
    const map = new Map<string, PartInstallation[]>();
    for (const inst of installsQ.data ?? []) {
      const arr = map.get(inst.partId) ?? [];
      arr.push(inst);
      map.set(inst.partId, arr);
    }
    for (const list of map.values()) {
      list.sort((a, b) => +new Date(b.installedAt) - +new Date(a.installedAt));
    }
    return map;
  }, [installsQ.data]);

  const detailInstalls = detail ? (installsByPart.get(detail.id) ?? []) : [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parts.filter(
      (p) =>
        (!q ||
          [p.partNumber, p.name, p.category, p.supplier]
            .join(" ")
            .toLowerCase()
            .includes(q)) &&
        (!category || p.category === category) &&
        (!status || p.status === status),
    );
  }, [parts, search, category, status]);

  const stats = useMemo(
    () => ({
      total: parts.length,
      low: parts.filter((p) => p.status === "low-stock").length,
      out: parts.filter((p) => p.status === "out-of-stock").length,
      inStock: parts.filter((p) => p.status === "in-stock").length,
    }),
    [parts],
  );

  const reorder = async (part: SparePart) => {
    const qty = part.reorderLevel * 3;
    await sparePartService.update(part.id, {
      quantity: qty,
      status: "in-stock",
      updatedAt: new Date().toISOString(),
    });
    toast.success(`Reordered ${part.name}`);
    setOpen(false);
    refetch();
  };

  const columns = useMemo<ColumnDef<SparePart>[]>(
    () => [
      {
        accessorKey: "partNumber",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Part #" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.partNumber}</span>
        ),
        meta: { label: "Part #" },
      },
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Part" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.category}</span>
          </div>
        ),
        meta: { label: "Part" },
      },
      {
        id: "compatibleWith",
        header: "Compatible",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex max-w-[220px] flex-wrap gap-1">
            {row.original.compatibleWith.slice(0, 2).map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px]">
                {c}
              </Badge>
            ))}
            {row.original.compatibleWith.length > 2 && (
              <Badge variant="outline" className="text-[10px]">
                +{row.original.compatibleWith.length - 2}
              </Badge>
            )}
          </div>
        ),
        meta: { label: "Compatible" },
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Qty" className="justify-end" />,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.quantity}
            <span className="ml-1 text-xs text-muted-foreground">
              / {row.original.reorderLevel}
            </span>
          </div>
        ),
        meta: { label: "Qty" },
      },
      {
        id: "installed",
        enableSorting: false,
        header: "Installed",
        cell: ({ row }) => {
          const count = installsByPart.get(row.original.id)?.length ?? 0;
          return (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={count === 0 ? "text-muted-foreground" : "font-medium"}>
                {count}
              </span>
            </span>
          );
        },
        meta: { label: "Installed" },
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
                <DropdownMenuItem onClick={() => reorder(row.original)}>
                  Reorder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 48,
      },
    ],
    [installsByPart],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spare Parts"
        description="Manage component stock used for repairs, swaps and refurbishment."
        icon={<PackageSearch className="h-5 w-5" />}
        tone="amber"
      >
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Part
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total parts" value={stats.total} icon={<PackageSearch className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Low stock" value={stats.low} tone="warning" icon={<TriangleAlert className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Out of stock" value={stats.out} tone="destructive" icon={<PackageX className="h-5 w-5" />} loading={loading} />
        <MiniStat label="In stock" value={stats.inStock} tone="success" icon={<Boxes className="h-5 w-5" />} loading={loading} />
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
        emptyTitle="No spare parts"
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search parts or numbers..."
              className="w-full sm:w-72"
            />
            <FilterSelect value={category} onChange={setCategory} options={[...SPARE_PART_CATEGORY_OPTIONS]} allLabel="All categories" />
            <FilterSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} allLabel="All statuses" />
          </>
        }
      />

      <DetailSheet
        open={open}
        onOpenChange={setOpen}
        headerBadge={detail && <StatusBadge status={detail.status} />}
        title={detail?.name ?? ""}
        subtitle={detail ? `${detail.partNumber} · ${detail.category}` : ""}
        sections={
          detail
            ? [
                {
                  title: "Stock",
                  rows: [
                    { label: "Quantity", value: detail.quantity },
                    { label: "Reorder level", value: detail.reorderLevel },
                    { label: "Location", value: detail.location },
                    { label: "Supplier", value: detail.supplier },
                    { label: "Updated", value: formatDate(detail.updatedAt) },
                  ],
                },
                {
                  title: "Compatibility",
                  rows: [
                    {
                      label: "Models",
                      value: (
                        <div className="flex flex-wrap justify-end gap-1">
                          {detail.compatibleWith.map((c) => (
                            <Badge key={c} variant="secondary" className="text-[10px]">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      ),
                    },
                  ],
                },
                {
                  title: `Installed on devices (${detailInstalls.length})`,
                  rows: detailInstalls.length
                    ? detailInstalls.map((inst) => ({
                        label: (
                          <Link
                            to={`/assets/${inst.assetId}`}
                            className="font-mono text-xs text-foreground hover:text-primary hover:underline"
                          >
                            {inst.assetTag}
                          </Link>
                        ),
                        value: (
                          <span className="flex items-center justify-end gap-1.5">
                            <span className="flex flex-col items-end">
                              <span className="max-w-[150px] truncate text-muted-foreground">
                                {inst.assetName}
                                {inst.quantity > 1 ? ` ×${inst.quantity}` : ""}
                              </span>
                              <span className="text-[11px] text-muted-foreground/70">
                                {formatDate(inst.installedAt)}
                                {inst.repairTicketNumber ? ` · ${inst.repairTicketNumber}` : ""}
                              </span>
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => removeInstall(inst.id)}
                              aria-label="Remove installation"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </span>
                        ),
                      }))
                    : [
                        {
                          label: "—",
                          value: (
                            <span className="text-muted-foreground">
                              Not yet installed on any device
                            </span>
                          ),
                        },
                      ],
                },
              ]
            : []
        }
        footer={
          detail && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => setInstallOpen(true)}>
                <PackagePlus className="h-4 w-4" /> Install to device
              </Button>
              <Button onClick={() => reorder(detail)}>Reorder</Button>
            </>
          )
        }
      />

      <InstallPartDialog
        open={installOpen}
        onOpenChange={setInstallOpen}
        fixedPart={detail}
        onCreated={() => installsQ.refetch()}
      />

      <SparePartFormDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAdd} />
    </div>
  );
}
