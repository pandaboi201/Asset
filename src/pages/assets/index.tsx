import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleCheck, Laptop, PackageCheck, Plus, Wrench } from "lucide-react";

import type { Asset } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { MiniStat } from "@/components/shared/mini-stat";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/use-async";
import { assetService } from "@/services";
import {
  ASSET_CATEGORY_OPTIONS,
  ASSET_STATUS_OPTIONS,
} from "@/config/constants";
import { toast } from "@/components/ui/sonner";
import { createAssetColumns } from "./asset-columns";
import { AssetFormDialog, type AssetFormValues } from "./asset-form-dialog";
import { IssueFormDialog } from "@/components/forms/issue-form-dialog";
import { CsvUpload } from "@/components/shared/csv-upload";

export function AssetsPage() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useAsync(() => assetService.all(), []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [toDelete, setToDelete] = useState<Asset | null>(null);
  const [issueAsset, setIssueAsset] = useState<Asset | null>(null);

  const assets = data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      const matchesSearch =
        !q ||
        [a.name, a.assetTag, a.serialNumber, a.assignedTo?.name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesStatus = !status || a.status === status;
      const matchesCategory = !category || a.category === category;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [assets, search, status, category]);

  const stats = useMemo(
    () => ({
      total: assets.length,
      inUse: assets.filter((a) => a.status === "in-use").length,
      available: assets.filter((a) => a.status === "available").length,
      servicing: assets.filter(
        (a) => a.status === "in-repair" || a.status === "maintenance",
      ).length,
    }),
    [assets],
  );

  const openView = (asset: Asset) => navigate(`/assets/${asset.id}`);
  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (asset: Asset) => {
    setEditing(asset);
    setFormOpen(true);
  };

  const columns = useMemo(
    () =>
      createAssetColumns({
        onView: openView,
        onEdit: openEdit,
        onDelete: (a) => setToDelete(a),
        onIssue: (a) => setIssueAsset(a),
      }),
    [],
  );

  const handleSubmit = async (values: AssetFormValues) => {
    if (editing) {
      await assetService.update(editing.id, values as Partial<Asset>);
      toast.success("Asset updated");
    } else {
      const now = new Date().toISOString();
      await assetService.create({
        ...values,
        id: `ast-${Date.now()}`,
        purchaseDate: now,
        warrantyExpiry: now,
        createdAt: now,
        updatedAt: now,
      } as unknown as Asset);
      toast.success("Asset created");
    }
    refetch();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    await assetService.remove(toDelete.id);
    toast.success(`${toDelete.assetTag} deleted`);
    setToDelete(null);
    refetch();
  };

  const handleBulkImport = async (parsedData: any[]) => {
    const now = new Date().toISOString();
    const mapped = parsedData.map((row) => ({
      ...row,
      id: `ast-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    }));
    
    try {
      const res = await assetService.bulkCreate(mapped as Partial<Asset>[]);
      if (res.failed > 0) {
        toast.warning(`Imported ${res.success}, but ${res.failed} failed.`);
      } else {
        toast.success(`Successfully imported ${res.success} assets!`);
      }
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Bulk import failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Management"
        description="Track, assign and audit every hardware asset across your organization."
        icon={<Laptop className="h-5 w-5" />}
      >
        <div className="flex items-center gap-2">
          <CsvUpload onDataParsed={handleBulkImport} />
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Asset
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          label="Total assets"
          value={stats.total}
          icon={<Laptop className="h-5 w-5" />}
          loading={loading}
        />
        <MiniStat
          label="In use"
          value={stats.inUse}
          tone="info"
          icon={<CircleCheck className="h-5 w-5" />}
          loading={loading}
        />
        <MiniStat
          label="Available"
          value={stats.available}
          tone="success"
          icon={<PackageCheck className="h-5 w-5" />}
          loading={loading}
        />
        <MiniStat
          label="In service"
          value={stats.servicing}
          tone="warning"
          icon={<Wrench className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(row) => row.id}
        onRowClick={openView}
        emptyTitle="No assets found"
        emptyDescription="Add your first asset or adjust the filters above."
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search assets, tags, serials..."
              className="w-full sm:w-64"
            />
            <FilterSelect
              value={status}
              onChange={setStatus}
              options={ASSET_STATUS_OPTIONS.map((s) => ({
                label: s.replace("-", " "),
                value: s,
              }))}
              allLabel="All statuses"
              placeholder="Status"
            />
            <FilterSelect
              value={category}
              onChange={setCategory}
              options={[...ASSET_CATEGORY_OPTIONS]}
              allLabel="All categories"
              placeholder="Category"
            />
          </>
        }
      />

      <AssetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        asset={editing}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete asset?"
        description={`This will permanently remove ${toDelete?.name} (${toDelete?.assetTag}) from the inventory. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
      <IssueFormDialog
        open={Boolean(issueAsset)}
        onOpenChange={(o) => !o && setIssueAsset(null)}
        defaultAssetId={issueAsset?.id}
        onCreated={refetch}
      />
    </div>
  );
}
