import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, MoreHorizontal, Plus, ScrollText } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { MiniStat } from "@/components/shared/mini-stat";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { formatDate } from "@/lib/format";

interface SoftwareLicense {
  id: string;
  name: string;
  vendor: string;
  licenseType: "perpetual" | "subscription" | "volume" | "oem";
  licenseKey: string;
  totalSeats: number;
  usedSeats: number;
  purchaseDate: string;
  expiryDate: string;
  cost: string;
  status: "active" | "expiring" | "expired" | "over-deployed";
  category: string;
}

const licenses: SoftwareLicense[] = [
  { id: "1", name: "Microsoft 365 E3", vendor: "Microsoft", licenseType: "subscription", licenseKey: "MS365-****-****-7842", totalSeats: 200, usedSeats: 178, purchaseDate: "2024-01-15", expiryDate: "2025-01-15", cost: "$72,000/yr", status: "active", category: "Productivity" },
  { id: "2", name: "Adobe Creative Cloud", vendor: "Adobe", licenseType: "subscription", licenseKey: "ACC-****-****-2319", totalSeats: 50, usedSeats: 48, purchaseDate: "2024-03-01", expiryDate: "2025-03-01", cost: "$39,600/yr", status: "expiring", category: "Design" },
  { id: "3", name: "Slack Business+", vendor: "Salesforce", licenseType: "subscription", licenseKey: "SLK-****-****-9901", totalSeats: 250, usedSeats: 210, purchaseDate: "2024-06-01", expiryDate: "2025-06-01", cost: "$31,500/yr", status: "active", category: "Communication" },
  { id: "4", name: "Jira Software Cloud", vendor: "Atlassian", licenseType: "subscription", licenseKey: "JIRA-****-****-5541", totalSeats: 100, usedSeats: 95, purchaseDate: "2024-02-15", expiryDate: "2025-02-15", cost: "$14,400/yr", status: "active", category: "Project Mgmt" },
  { id: "5", name: "AutoCAD 2024", vendor: "Autodesk", licenseType: "perpetual", licenseKey: "ACAD-****-****-1120", totalSeats: 15, usedSeats: 18, purchaseDate: "2023-09-01", expiryDate: "—", cost: "$22,500", status: "over-deployed", category: "Engineering" },
  { id: "6", name: "Zoom Enterprise", vendor: "Zoom", licenseType: "subscription", licenseKey: "ZM-****-****-7733", totalSeats: 300, usedSeats: 195, purchaseDate: "2024-04-01", expiryDate: "2025-04-01", cost: "$54,000/yr", status: "active", category: "Communication" },
  { id: "7", name: "Norton 360 Business", vendor: "NortonLifeLock", licenseType: "subscription", licenseKey: "NRT-****-****-4488", totalSeats: 200, usedSeats: 200, purchaseDate: "2023-11-01", expiryDate: "2024-11-01", cost: "$15,000/yr", status: "expired", category: "Security" },
  { id: "8", name: "VMware vSphere", vendor: "Broadcom", licenseType: "perpetual", licenseKey: "VMW-****-****-6622", totalSeats: 10, usedSeats: 8, purchaseDate: "2023-06-15", expiryDate: "—", cost: "$85,000", status: "active", category: "Virtualization" },
  { id: "9", name: "Figma Organization", vendor: "Figma", licenseType: "subscription", licenseKey: "FIG-****-****-3355", totalSeats: 40, usedSeats: 38, purchaseDate: "2024-05-01", expiryDate: "2025-05-01", cost: "$18,000/yr", status: "active", category: "Design" },
  { id: "10", name: "GitHub Enterprise", vendor: "GitHub", licenseType: "subscription", licenseKey: "GH-****-****-8899", totalSeats: 80, usedSeats: 72, purchaseDate: "2024-01-01", expiryDate: "2025-01-01", cost: "$16,800/yr", status: "expiring", category: "Development" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Expiring", value: "expiring" },
  { label: "Expired", value: "expired" },
  { label: "Over-deployed", value: "over-deployed" },
];

export function SoftwareLicensesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return licenses.filter((l) => {
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.vendor.toLowerCase().includes(q);
      const matchesStatus = !status || l.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

  const columns = useMemo<ColumnDef<SoftwareLicense>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Software" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-6/8 text-chart-6 ring-1 ring-chart-6/10">
              <ScrollText className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.vendor}</p>
            </div>
          </div>
        ),
        meta: { label: "Software" },
      },
      {
        accessorKey: "licenseType",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.licenseType}
          </Badge>
        ),
        meta: { label: "Type" },
      },
      {
        id: "usage",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Usage" />,
        cell: ({ row }) => {
          const { usedSeats, totalSeats } = row.original;
          const pct = Math.round((usedSeats / totalSeats) * 100);
          const tone = pct > 100 ? "bg-destructive" : pct > 90 ? "bg-warning" : "bg-success";
          return (
            <div className="w-32 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium tabular-nums">{usedSeats}/{totalSeats}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <Progress value={Math.min(pct, 100)} indicatorClassName={tone} className="h-1.5" />
            </div>
          );
        },
        meta: { label: "Usage" },
      },
      {
        accessorKey: "cost",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cost" />,
        cell: ({ row }) => <span className="text-sm font-semibold">{row.original.cost}</span>,
        meta: { label: "Cost" },
      },
      {
        accessorKey: "expiryDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Expires" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.expiryDate === "—" ? "Perpetual" : formatDate(row.original.expiryDate)}
          </span>
        ),
        meta: { label: "Expires" },
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
                <DropdownMenuItem onClick={() => toast.info("View license (demo)")}>View details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Renew license (demo)")}>Renew</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 48,
      },
    ],
    [],
  );

  const totalCostNum = licenses.length;
  const expiringSoon = licenses.filter((l) => l.status === "expiring").length;
  const overDeployed = licenses.filter((l) => l.status === "over-deployed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Software Licenses"
        description="Track software entitlements, compliance and renewal schedules."
        icon={<ScrollText className="h-5 w-5" />}
      >
        <Button onClick={() => toast.info("Add license form (demo)")}>
          <Plus className="h-4 w-4" /> Add License
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total Licenses" value={totalCostNum} icon={<ScrollText className="h-5 w-5" />} />
        <MiniStat label="Expiring Soon" value={expiringSoon} tone="warning" icon={<AlertTriangle className="h-5 w-5" />} />
        <MiniStat label="Over-deployed" value={overDeployed} tone="destructive" icon={<AlertTriangle className="h-5 w-5" />} />
        <MiniStat label="Active" value={licenses.filter((l) => l.status === "active").length} tone="success" icon={<ScrollText className="h-5 w-5" />} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={false}
        getRowId={(row) => row.id}
        emptyTitle="No software licenses found"
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search software..."
              className="w-full sm:w-72"
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
    </div>
  );
}
