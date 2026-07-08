import { Pencil, Cpu, MapPin, Calendar, DollarSign, User } from "lucide-react";

import type { Asset } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate, getInitials } from "@/lib/format";

function Row({
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

interface AssetDetailSheetProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (asset: Asset) => void;
}

export function AssetDetailSheet({
  asset,
  open,
  onOpenChange,
  onEdit,
}: AssetDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        {asset && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {asset.assetTag}
                </span>
                <StatusBadge status={asset.status} />
              </div>
              <SheetTitle className="text-xl">{asset.name}</SheetTitle>
              <SheetDescription>
                {asset.manufacturer} · {asset.model}
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-6">
                {asset.assignedTo ? (
                  <div className="mb-4 flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(asset.assignedTo.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {asset.assignedTo.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Currently assigned · {asset.department}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                    <User className="h-4 w-4" /> Not currently assigned
                  </div>
                )}

                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Specifications
                </p>
                <div className="divide-y">
                  <Row icon={<Cpu className="h-4 w-4" />} label="Category" value={asset.category} />
                  <Row icon={<Cpu className="h-4 w-4" />} label="Serial number" value={<span className="font-mono">{asset.serialNumber}</span>} />
                  <Row icon={<Cpu className="h-4 w-4" />} label="Condition" value={<StatusBadge status={asset.condition} withDot={false} />} />
                  <Row icon={<MapPin className="h-4 w-4" />} label="Location" value={asset.location} />
                </div>

                <Separator className="my-4" />
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Financials
                </p>
                <div className="divide-y">
                  <Row icon={<DollarSign className="h-4 w-4" />} label="Purchase cost" value={formatCurrency(asset.purchaseCost)} />
                  <Row icon={<DollarSign className="h-4 w-4" />} label="Current value" value={formatCurrency(asset.currentValue)} />
                  <Row icon={<User className="h-4 w-4" />} label="Supplier" value={asset.supplier} />
                </div>

                <Separator className="my-4" />
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Lifecycle
                </p>
                <div className="divide-y">
                  <Row icon={<Calendar className="h-4 w-4" />} label="Purchased" value={formatDate(asset.purchaseDate)} />
                  <Row icon={<Calendar className="h-4 w-4" />} label="Warranty expiry" value={formatDate(asset.warrantyExpiry)} />
                  <Row icon={<Calendar className="h-4 w-4" />} label="Last updated" value={formatDate(asset.updatedAt)} />
                </div>
              </div>
            </ScrollArea>

            <SheetFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => onEdit(asset)}>
                <Pencil className="h-4 w-4" /> Edit asset
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
