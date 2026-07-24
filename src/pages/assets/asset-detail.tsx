import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Cpu,
  MapPin,
  PackagePlus,
  Pencil,
  Trash2,
  User as UserIcon,
} from "lucide-react";

import type { Asset } from "@/types";
import { useAsync } from "@/hooks/use-async";
import {
  assetService,
  getAssetHistory,
  partInstallationService,
} from "@/services";
import { formatDate, getInitials } from "@/lib/format";
import { toast } from "@/components/ui/sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { HistoryTimeline } from "@/components/shared/history-timeline";
import { InstallPartDialog } from "@/components/shared/install-part-dialog";
import { ListSkeleton } from "@/components/shared/loading";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetFormDialog, type AssetFormValues } from "./asset-form-dialog";

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <span className="text-muted-foreground/60">{icon}</span>
        {label}
      </span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export function AssetDetailPage() {
  const { assetId = "" } = useParams();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);

  const { data, loading, refetch } = useAsync(async () => {
    const asset = await assetService.getById(assetId);
    if (!asset) return { asset: undefined, history: undefined };
    const history = await getAssetHistory(asset.assetTag);
    return { asset, history };
  }, [assetId]);

  const asset = data?.asset;
  const history = data?.history;

  const handleSubmit = async (values: AssetFormValues) => {
    if (!asset) return;
    await assetService.update(asset.id, values as Partial<Asset>);
    toast.success("Asset updated");
    refetch();
  };

  const removeInstall = async (id: string) => {
    await partInstallationService.remove(id);
    toast.success("Part installation removed");
    refetch();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-56 lg:col-span-1" />
          <Skeleton className="h-56 lg:col-span-2" />
        </div>
        <Card className="p-6">
          <ListSkeleton rows={6} />
        </Card>
      </div>
    );
  }

  if (!asset) {
    return (
      <EmptyState
        icon={Cpu}
        title="Device not found"
        description="This asset may have been removed or the link is invalid."
        action={
          <Button variant="outline" asChild>
            <Link to="/assets">
              <ArrowLeft className="h-4 w-4" /> Back to assets
            </Link>
          </Button>
        }
      />
    );
  }

  const counts = {
    issues: history?.issues.length ?? 0,
    repairs: history?.repairs.length ?? 0,
    upgrades: history?.upgrades.length ?? 0,
    parts: history?.parts.length ?? 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/assets")}
            aria-label="Back to assets"
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {asset.assetTag}
              </span>
              <StatusBadge status={asset.status} />
              <StatusBadge status={asset.condition} withDot={false} />
            </div>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
              {asset.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {asset.manufacturer} · {asset.model} · {asset.category}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Assignment Card */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            {asset.assignedTo ? (
              <Link
                to="/users"
                className="group flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3.5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/5"
              >
                <Avatar className="h-11 w-11 ring-2 ring-primary/10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {getInitials(asset.assignedTo.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {asset.assignedTo.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {asset.department}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-border/60 bg-muted/20 p-3.5 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" /> Not currently assigned
              </div>
            )}
            <Separator className="my-4" />
            <div className="divide-y divide-border/40">
              <DetailRow
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={asset.location}
              />
              <DetailRow
                icon={<UserIcon className="h-4 w-4" />}
                label="Department"
                value={asset.department}
              />
            </div>
          </CardContent>
        </Card>

        {/* Device Details Card */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Device Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-8 sm:grid-cols-2">
            <div className="divide-y divide-border/40">
              <DetailRow
                icon={<Cpu className="h-4 w-4" />}
                label="Category"
                value={asset.category}
              />
              <DetailRow
                icon={<Cpu className="h-4 w-4" />}
                label="Serial number"
                value={
                  <span className="font-mono text-xs">
                    {asset.serialNumber}
                  </span>
                }
              />
              <DetailRow
                icon={<Cpu className="h-4 w-4" />}
                label="Manufacturer"
                value={asset.manufacturer}
              />
            </div>
            <div className="divide-y divide-border/40">
              <DetailRow
                icon={<Calendar className="h-4 w-4" />}
                label="Purchased"
                value={formatDate(asset.purchaseDate)}
              />
              <DetailRow
                icon={<Calendar className="h-4 w-4" />}
                label="Warranty expires"
                value={
                  <span
                    className={
                      new Date(asset.warrantyExpiry) < new Date()
                        ? "text-destructive"
                        : ""
                    }
                  >
                    {formatDate(asset.warrantyExpiry)}
                  </span>
                }
              />
              <DetailRow
                icon={<UserIcon className="h-4 w-4" />}
                label="Supplier"
                value={asset.supplier}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Tabs */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <Tabs defaultValue="timeline">
            <TabsList className="flex-wrap">
              <TabsTrigger value="timeline">Full History</TabsTrigger>
              <TabsTrigger value="issues">
                Issues ({counts.issues})
              </TabsTrigger>
              <TabsTrigger value="repairs">
                Repairs ({counts.repairs})
              </TabsTrigger>
              <TabsTrigger value="upgrades">
                Upgrades ({counts.upgrades})
              </TabsTrigger>
              <TabsTrigger value="parts">
                Parts ({counts.parts})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="pt-4">
              <HistoryTimeline events={history?.timeline ?? []} />
            </TabsContent>

            <TabsContent value="issues">
              {counts.issues === 0 ? (
                <EmptyState
                  title="No issue records"
                  description="This device has never been issued."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Issued to</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Returned</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history!.issues.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell className="font-mono text-xs">
                          {it.reference}
                        </TableCell>
                        <TableCell>{it.issuedTo.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(it.issueDate)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(it.dueDate)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {it.returnDate ? formatDate(it.returnDate) : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={it.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="repairs">
              {counts.repairs === 0 ? (
                <EmptyState
                  title="No repair tickets"
                  description="This device has no repair history."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Reported</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history!.repairs.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">
                          {r.ticketNumber}
                        </TableCell>
                        <TableCell>{r.issueSummary}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.assignedTechnician?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(r.reportedAt)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="upgrades">
              {counts.upgrades === 0 ? (
                <EmptyState
                  title="No upgrades"
                  description="No upgrades have been recorded for this device."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Upgrade</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>By</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history!.upgrades.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.fromSpec && u.toSpec
                            ? `${u.fromSpec} → ${u.toSpec}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {u.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.performedBy.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(u.performedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="parts">
              <div className="mb-3 flex items-center justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInstallOpen(true)}
                >
                  <PackagePlus className="h-4 w-4" /> Install part
                </Button>
              </div>
              {counts.parts === 0 ? (
                <EmptyState
                  title="No parts installed"
                  description="No spare parts have been fitted to this device."
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInstallOpen(true)}
                    >
                      <PackagePlus className="h-4 w-4" /> Install part
                    </Button>
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Part #</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Installed by</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Ref</TableHead>
                      <TableHead className="text-right">Remove</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history!.parts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.partName}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.partNumber}
                        </TableCell>
                        <TableCell>{p.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.installedBy.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(p.installedAt)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {p.repairTicketNumber ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeInstall(p.id)}
                            aria-label="Remove part installation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AssetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        asset={asset}
        onSubmit={handleSubmit}
      />

      <InstallPartDialog
        open={installOpen}
        onOpenChange={setInstallOpen}
        fixedAsset={asset}
        onCreated={refetch}
      />
    </motion.div>
  );
}
