import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Star, Store } from "lucide-react";

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

interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpend: string;
  rating: number;
  status: "active" | "inactive" | "preferred";
  contractEnd: string;
}

const vendors: Vendor[] = [
  { id: "1", name: "Dell Technologies", category: "Hardware", contactPerson: "John Smith", email: "sales@dell.com", phone: "+1-800-999-3355", totalOrders: 156, totalSpend: "$1.2M", rating: 4.8, status: "preferred", contractEnd: "2025-12-31" },
  { id: "2", name: "HP Enterprise", category: "Hardware", contactPerson: "Jane Doe", email: "enterprise@hp.com", phone: "+1-800-474-6836", totalOrders: 89, totalSpend: "$680K", rating: 4.5, status: "active", contractEnd: "2025-09-15" },
  { id: "3", name: "Cisco Systems", category: "Networking", contactPerson: "Bob Wilson", email: "partners@cisco.com", phone: "+1-800-553-6387", totalOrders: 42, totalSpend: "$450K", rating: 4.7, status: "preferred", contractEnd: "2026-03-01" },
  { id: "4", name: "Microsoft", category: "Software", contactPerson: "Alice Brown", email: "licensing@microsoft.com", phone: "+1-800-642-7676", totalOrders: 12, totalSpend: "$320K", rating: 4.6, status: "active", contractEnd: "2025-11-30" },
  { id: "5", name: "Lenovo", category: "Hardware", contactPerson: "Mike Chen", email: "business@lenovo.com", phone: "+1-855-253-6686", totalOrders: 67, totalSpend: "$520K", rating: 4.3, status: "active", contractEnd: "2025-08-20" },
  { id: "6", name: "CDW", category: "Reseller", contactPerson: "Sarah Lee", email: "accounts@cdw.com", phone: "+1-800-839-4239", totalOrders: 203, totalSpend: "$890K", rating: 4.4, status: "preferred", contractEnd: "2026-01-15" },
  { id: "7", name: "Palo Alto Networks", category: "Security", contactPerson: "Tom Harris", email: "sales@paloalto.com", phone: "+1-866-320-4788", totalOrders: 18, totalSpend: "$280K", rating: 4.9, status: "active", contractEnd: "2025-10-01" },
  { id: "8", name: "APC by Schneider", category: "Infrastructure", contactPerson: "Grace Kim", email: "support@apc.com", phone: "+1-800-800-4272", totalOrders: 34, totalSpend: "$150K", rating: 4.2, status: "inactive", contractEnd: "2024-12-31" },
];

export function VendorsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q),
    );
  }, [search]);

  const columns = useMemo<ColumnDef<Vendor>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10">
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
          <Badge
            variant="outline"
            className={
              row.original.status === "preferred"
                ? "badge-info"
                : row.original.status === "active"
                  ? "badge-success"
                  : "badge-warning"
            }
          >
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
                <DropdownMenuItem onClick={() => toast.info("View vendor (demo)")}>View details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Edit vendor (demo)")}>Edit</DropdownMenuItem>
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
      >
        <Button onClick={() => toast.info("Add vendor form (demo)")}>
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total Vendors" value={vendors.length} icon={<Store className="h-5 w-5" />} />
        <MiniStat label="Preferred" value={vendors.filter((v) => v.status === "preferred").length} tone="info" icon={<Star className="h-5 w-5" />} />
        <MiniStat label="Active" value={vendors.filter((v) => v.status === "active").length} tone="success" icon={<Store className="h-5 w-5" />} />
        <MiniStat label="Total Orders" value={vendors.reduce((s, v) => s + v.totalOrders, 0)} tone="warning" icon={<Store className="h-5 w-5" />} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={false}
        getRowId={(row) => row.id}
        emptyTitle="No vendors found"
        toolbar={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search vendors..."
            className="w-full sm:w-72"
          />
        }
      />
    </div>
  );
}
