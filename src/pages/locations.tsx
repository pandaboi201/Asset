import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MapPin, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

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
import { locationService, type AppLocation } from "@/services";
import { toast } from "@/components/ui/sonner";
import {
  LocationFormDialog,
  type LocationFormValues,
} from "./location-form-dialog";

const TYPE_COLORS: Record<AppLocation["type"], string> = {
  office: "badge-info",
  warehouse: "badge-warning",
  datacenter: "badge-success",
  remote: "badge-destructive",
};

export function LocationsPage() {
  const { data, loading, refetch } = useAsync(() => locationService.all(), []);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<AppLocation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppLocation | null>(null);
  const [toDelete, setToDelete] = useState<AppLocation | null>(null);

  const locations = data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q),
    );
  }, [locations, search]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (l: AppLocation) => {
    setEditing(l);
    setFormOpen(true);
  };

  const handleSubmit = async (values: LocationFormValues) => {
    if (editing) {
      await locationService.update(editing.id, values);
      toast.success("Location updated");
    } else {
      await locationService.create(values);
      toast.success("Location created");
    }
    refetch();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await locationService.remove(toDelete.id);
    toast.success(`${toDelete.name} deleted`);
    setToDelete(null);
    refetch();
  };

  const columns = useMemo<ColumnDef<AppLocation>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3 ring-1 ring-chart-3/15">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.address}</p>
            </div>
          </div>
        ),
        meta: { label: "Location" },
      },
      {
        accessorKey: "city",
        header: ({ column }) => <DataTableColumnHeader column={column} title="City" />,
        cell: ({ row }) => (
          <span className="text-sm">{row.original.city}, {row.original.country}</span>
        ),
        meta: { label: "City" },
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => (
          <Badge variant="outline" className={TYPE_COLORS[row.original.type]}>
            {row.original.type}
          </Badge>
        ),
        meta: { label: "Type" },
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
        accessorKey: "capacity",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Capacity" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular-nums">{row.original.capacity}</span>
        ),
        meta: { label: "Capacity" },
      },
      {
        accessorKey: "manager",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Manager" />,
        cell: ({ row }) => <span className="text-sm">{row.original.manager}</span>,
        meta: { label: "Manager" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <Badge variant="outline" className={row.original.status === "active" ? "badge-success" : "badge-warning"}>
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

  const totalAssets = locations.reduce((s, l) => s + l.assetCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Manage office locations, warehouses, data centers and remote zones."
        icon={<MapPin className="h-5 w-5" />}
        tone="teal"
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Location
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total Locations" value={locations.length} icon={<MapPin className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Total Assets" value={totalAssets} tone="info" icon={<MapPin className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Offices" value={locations.filter((l) => l.type === "office").length} tone="success" icon={<MapPin className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Data Centers" value={locations.filter((l) => l.type === "datacenter").length} tone="warning" icon={<MapPin className="h-5 w-5" />} loading={loading} />
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
        emptyTitle="No locations found"
        emptyDescription="Add your first location to get started."
        toolbar={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search locations..."
            className="w-full sm:w-72"
          />
        }
      />

      <LocationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        location={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete location?"
        description={`This will permanently remove ${toDelete?.name}. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />

      <DetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        headerBadge={detail && (
          <Badge variant="outline" className={TYPE_COLORS[detail.type]}>
            {detail.type}
          </Badge>
        )}
        title={detail?.name ?? ""}
        subtitle={detail ? `${detail.city}, ${detail.country}` : ""}
        sections={
          detail
            ? [
                {
                  title: "Overview",
                  rows: [
                    { label: "Address", value: detail.address },
                    { label: "Manager", value: detail.manager },
                    { label: "Assets", value: detail.assetCount },
                    { label: "Capacity", value: detail.capacity },
                    { label: "Status", value: detail.status },
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
