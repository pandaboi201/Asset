import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MapPin, MoreHorizontal, Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { MiniStat } from "@/components/shared/mini-stat";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  type: "office" | "warehouse" | "datacenter" | "remote";
  assetCount: number;
  capacity: number;
  manager: string;
  status: "active" | "inactive";
}

const locations: Location[] = [
  { id: "1", name: "HQ - San Francisco", address: "123 Market St", city: "San Francisco", country: "USA", type: "office", assetCount: 245, capacity: 300, manager: "James Mitchell", status: "active" },
  { id: "2", name: "NYC Office", address: "456 Broadway", city: "New York", country: "USA", type: "office", assetCount: 128, capacity: 150, manager: "Sarah Chen", status: "active" },
  { id: "3", name: "London Office", address: "10 Downing St", city: "London", country: "UK", type: "office", assetCount: 65, capacity: 80, manager: "Marcus Williams", status: "active" },
  { id: "4", name: "Central Warehouse", address: "789 Industrial Blvd", city: "Dallas", country: "USA", type: "warehouse", assetCount: 450, capacity: 1000, manager: "Robert Kim", status: "active" },
  { id: "5", name: "US-West Data Center", address: "100 Cloud Ave", city: "Portland", country: "USA", type: "datacenter", assetCount: 320, capacity: 500, manager: "Emily Zhang", status: "active" },
  { id: "6", name: "EU Data Center", address: "50 Server Lane", city: "Frankfurt", country: "Germany", type: "datacenter", assetCount: 180, capacity: 400, manager: "David Rodriguez", status: "active" },
  { id: "7", name: "Remote Workers", address: "—", city: "Various", country: "Global", type: "remote", assetCount: 92, capacity: 200, manager: "Amanda Foster", status: "active" },
  { id: "8", name: "Singapore Office", address: "1 Raffles Place", city: "Singapore", country: "Singapore", type: "office", assetCount: 35, capacity: 50, manager: "Linda Thompson", status: "inactive" },
];

const TYPE_COLORS: Record<Location["type"], string> = {
  office: "badge-info",
  warehouse: "badge-warning",
  datacenter: "badge-success",
  remote: "badge-destructive",
};

export function LocationsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q),
    );
  }, [search]);

  const columns = useMemo<ColumnDef<Location>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10">
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
        cell: () => (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => toast.info("View location (demo)")}>View details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Edit location (demo)")}>Edit</DropdownMenuItem>
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
      >
        <Button onClick={() => toast.info("Add location form (demo)")}>
          <Plus className="h-4 w-4" /> Add Location
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total Locations" value={locations.length} icon={<MapPin className="h-5 w-5" />} />
        <MiniStat label="Total Assets" value={totalAssets} tone="info" icon={<MapPin className="h-5 w-5" />} />
        <MiniStat label="Offices" value={locations.filter((l) => l.type === "office").length} tone="success" icon={<MapPin className="h-5 w-5" />} />
        <MiniStat label="Data Centers" value={locations.filter((l) => l.type === "datacenter").length} tone="warning" icon={<MapPin className="h-5 w-5" />} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={false}
        getRowId={(row) => row.id}
        emptyTitle="No locations found"
        toolbar={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search locations..."
            className="w-full sm:w-72"
          />
        }
      />
    </div>
  );
}
