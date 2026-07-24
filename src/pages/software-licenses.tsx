import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  ScrollText,
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { MiniStat } from "@/components/shared/mini-stat";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { formatDate } from "@/lib/format";
import { useAsync } from "@/hooks/use-async";
import { softwareLicenseService, type SoftwareLicense } from "@/services";
import {
  LicenseFormDialog,
  type LicenseFormValues,
} from "./software-license-form-dialog";

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Expiring", value: "expiring" },
  { label: "Expired", value: "expired" },
  { label: "Over-deployed", value: "over-deployed" },
];

export function SoftwareLicensesPage() {
  const { data, loading, refetch } = useAsync(() => softwareLicenseService.all(), []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SoftwareLicense | null>(null);
  const [toDelete, setToDelete] = useState<SoftwareLicense | null>(null);

  const licenses = data ?? [];

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
  }, [licenses, search, status]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (l: SoftwareLicense) => {
    setEditing(l);
    setFormOpen(true);
  };

  const handleSubmit = async (values: LicenseFormValues) => {
    const payload = {
      name: values.name,
      vendor: values.vendor,
      licenseType: values.licenseType,
      totalSeats: values.totalSeats,
      category: values.category,
      costCentsPerYear: Math.round(values.costPerYear * 100),
      expiryDate: values.expiryDate || undefined,
    };
    if (editing) {
      await softwareLicenseService.update(editing.id, payload);
      toast.success("License updated");
    } else {
      await softwareLicenseService.create({
        ...payload,
        licenseKey: `${values.name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
        purchaseDate: new Date().toISOString(),
        usedSeats: 0,
        status: "active",
      } as unknown as Partial<SoftwareLicense>);
      toast.success("License created");
    }
    refetch();
  };

  const renew = async (license: SoftwareLicense) => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    await softwareLicenseService.update(license.id, {
      status: "active",
      expiryDate: nextYear.toISOString(),
    } as Partial<SoftwareLicense>);
    toast.success(`${license.name} renewed through ${formatDate(nextYear.toISOString())}`);
    refetch();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await softwareLicenseService.remove(toDelete.id);
    toast.success(`${toDelete.name} removed`);
    setToDelete(null);
    refetch();
  };

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
                <DropdownMenuItem onClick={() => openEdit(row.original)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </DropdownMenuItem>
                {row.original.licenseType !== "perpetual" && (
                  <DropdownMenuItem onClick={() => renew(row.original)}>
                    <RefreshCw className="h-3.5 w-3.5" /> Renew (1 year)
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setToDelete(row.original)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
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

  const expiringSoon = licenses.filter((l) => l.status === "expiring").length;
  const overDeployed = licenses.filter((l) => l.status === "over-deployed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Software Licenses"
        description="Track software entitlements, compliance and renewal schedules."
        icon={<ScrollText className="h-5 w-5" />}
        tone="purple"
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add License
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total Licenses" value={licenses.length} icon={<ScrollText className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Expiring Soon" value={expiringSoon} tone="warning" icon={<AlertTriangle className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Over-deployed" value={overDeployed} tone="destructive" icon={<AlertTriangle className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Active" value={licenses.filter((l) => l.status === "active").length} tone="success" icon={<ScrollText className="h-5 w-5" />} loading={loading} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(row) => row.id}
        emptyTitle="No software licenses found"
        emptyDescription="Add your first license to start tracking compliance."
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

      <LicenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        license={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remove license?"
        description={`This will permanently remove ${toDelete?.name} from tracking. This action cannot be undone.`}
        confirmLabel="Remove"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
