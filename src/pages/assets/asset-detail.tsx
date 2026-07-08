import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Cpu,
  MapPin,
  Pencil,
  User as UserIcon,
} from "lucide-react";

import type { Asset } from "@/types";
import { useAsync } from "@/hooks/use-async";
import { assetService, getAssetHistory } from "@/services";
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
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-muted-foreground/70">{icon}</span>
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-48 lg:col-span-1" />
          <Skeleton className="h-48 lg:col-span-2" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/assets")}
            aria-label="Back to assets"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {asset.assetTag}
              </span>
              <StatusBadge status={asset.status} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{asset.name}</h1>
            <p className="text-sm text-muted-foreground">
              {asset.manufacturer} · {asset.model}
            </p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Pencil className="h-4 w-4" /> Edit device
        </Button>
      </div>

      {/* Overview */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            {asset.assignedTo ? (
              <Link
                to="/users"
                className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-accent/50"
              >
                <Avatar className="h-11 w-11">
                  <AvatarFallback>
                    {getInitials(asset.assignedTo.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {asset.assignedTo.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {asset.department}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" /> Not currently assigned
              </div>
            )}
            <Separator className="my-4" />
            <div className="divide-y">
              <DetailRow icon={<MapPin className="h-4 w-4" />} label="Location" value={asset.location} />
              <DetailRow icon={<UserIcon className="h-4 w-4" />} label="Department" value={asset.department} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Device details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-8 sm:grid-cols-2">
            <div className="divide-y">
              <DetailRow icon={<Cpu className="h-4 w-4" />} label="Category" value={asset.category} />
              <DetailRow icon={<Cpu className="h-4 w-4" />} label="Serial number" value={<span className="font-mono">{asset.serialNumber}</span>} />
              <DetailRow icon={<Cpu className="h-4 w-4" />} label="Condition" value={<StatusBadge status={asset.condition} withDot={false} />} />
            </div>
            <div className="divide-y">
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Purchased" value={formatDate(asset.purchaseDate)} />
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Warranty" value={formatDate(asset.warrantyExpiry)} />
              <DetailRow icon={<UserIcon className="h-4 w-4" />} label="Supplier" value={asset.supplier} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="timeline">
            <TabsList className="flex-wrap">
              <TabsTrigger value="timeline">Full History</TabsTrigger>
              <TabsTrigger value="issues">Issue History ({counts.issues})</TabsTrigger>
              <TabsTrigger value="repairs">Repairs ({counts.repairs})</TabsTrigger>
              <TabsTrigger value="upgrades">Upgrades ({counts.upgrades})</TabsTrigger>
              <TabsTrigger value="parts">Parts ({counts.parts})</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="pt-2">
              <HistoryTimeline events={history?.timeline ?? []} />
            </TabsContent>

            <TabsContent value="issues">
              {counts.issues === 0 ? (
                <EmptyState title="No issue records" description="This device has never been issued." />
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
                        <TableCell className="font-mono text-xs">{it.reference}</TableCell>
                        <TableCell>{it.issuedTo.name}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(it.issueDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(it.dueDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{it.returnDate ? formatDate(it.returnDate) : "—"}</TableCell>
                        <TableCell><StatusBadge status={it.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="repairs">
              {counts.repairs === 0 ? (
                <EmptyState title="No repair tickets" description="This device has no repair history." />
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
                        <TableCell className="font-mono text-xs">{r.ticketNumber}</TableCell>
                        <TableCell>{r.issueSummary}</TableCell>
                        <TableCell className="text-muted-foreground">{r.assignedTechnician?.name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(r.reportedAt)}</TableCell>
                        <TableCell><StatusBadge status={r.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="upgrades">
              {counts.upgrades === 0 ? (
                <EmptyState title="No upgrades" description="No upgrades have been recorded for this device." />
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
                        <TableCell className="font-medium">{u.title}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.fromSpec && u.toSpec ? `${u.fromSpec} → ${u.toSpec}` : "—"}
                        </TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{u.type}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{u.performedBy.name}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(u.performedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="parts">
              {counts.parts === 0 ? (
                <EmptyState title="No parts installed" description="No spare parts have been fitted to this device." />
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history!.parts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.partName}</TableCell>
                        <TableCell className="font-mono text-xs">{p.partNumber}</TableCell>
                        <TableCell>{p.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{p.installedBy.name}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(p.installedAt)}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.repairTicketNumber ?? "—"}</TableCell>
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
    </div>
  );
}
