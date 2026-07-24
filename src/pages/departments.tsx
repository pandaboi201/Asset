import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, MoreHorizontal, Plus, Users } from "lucide-react";

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

interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  headCount: number;
  assetCount: number;
  budget: string;
  location: string;
  status: "active" | "inactive";
}

const departments: Department[] = [
  { id: "1", name: "Engineering", code: "ENG", head: "Sarah Chen", headCount: 45, assetCount: 112, budget: "$2.4M", location: "Floor 3", status: "active" },
  { id: "2", name: "Product Design", code: "DSG", head: "Marcus Williams", headCount: 18, assetCount: 42, budget: "$800K", location: "Floor 3", status: "active" },
  { id: "3", name: "Marketing", code: "MKT", head: "Jessica Park", headCount: 22, assetCount: 38, budget: "$1.2M", location: "Floor 2", status: "active" },
  { id: "4", name: "Sales", code: "SAL", head: "David Rodriguez", headCount: 30, assetCount: 65, budget: "$1.8M", location: "Floor 2", status: "active" },
  { id: "5", name: "Human Resources", code: "HR", head: "Amanda Foster", headCount: 12, assetCount: 18, budget: "$450K", location: "Floor 1", status: "active" },
  { id: "6", name: "Finance", code: "FIN", head: "Robert Kim", headCount: 15, assetCount: 22, budget: "$600K", location: "Floor 1", status: "active" },
  { id: "7", name: "IT Operations", code: "OPS", head: "James Mitchell", headCount: 20, assetCount: 85, budget: "$3.1M", location: "Floor 4", status: "active" },
  { id: "8", name: "Customer Support", code: "SUP", head: "Linda Thompson", headCount: 25, assetCount: 30, budget: "$900K", location: "Floor 1", status: "active" },
  { id: "9", name: "Legal", code: "LGL", head: "Michael Scott", headCount: 8, assetCount: 12, budget: "$350K", location: "Floor 2", status: "active" },
  { id: "10", name: "Research", code: "R&D", head: "Emily Zhang", headCount: 14, assetCount: 28, budget: "$1.5M", location: "Floor 4", status: "inactive" },
];

export function DepartmentsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.head.toLowerCase().includes(q),
    );
  }, [search]);

  const columns = useMemo<ColumnDef<Department>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10">
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
                <DropdownMenuItem onClick={() => toast.info("View department (demo)")}>
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Edit department (demo)")}>
                  Edit
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
      >
        <Button onClick={() => toast.info("Add department form (demo)")}>
          <Plus className="h-4 w-4" /> Add Department
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Departments" value={departments.length} icon={<Building2 className="h-5 w-5" />} />
        <MiniStat label="Total Employees" value={totalEmployees} tone="info" icon={<Users className="h-5 w-5" />} />
        <MiniStat label="Total Assets" value={totalAssets} tone="success" icon={<Building2 className="h-5 w-5" />} />
        <MiniStat label="Active" value={departments.filter((d) => d.status === "active").length} tone="success" icon={<Building2 className="h-5 w-5" />} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={false}
        getRowId={(row) => row.id}
        emptyTitle="No departments found"
        toolbar={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search departments..."
            className="w-full sm:w-72"
          />
        }
      />
    </div>
  );
}
