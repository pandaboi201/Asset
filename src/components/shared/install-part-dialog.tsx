import { useEffect, useState } from "react";

import type { Asset, PartInstallation, SparePart } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAsync } from "@/hooks/use-async";
import { assetService, partInstallationService, sparePartService } from "@/services";
import { currentUser } from "@/config/constants";
import { toast } from "@/components/ui/sonner";

interface InstallPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected part (used from the Spare Parts page). */
  fixedPart?: SparePart | null;
  /** Pre-selected device (used from the device detail page). */
  fixedAsset?: Asset | null;
  /** Called after a successful installation log. */
  onCreated?: () => void;
}

export function InstallPartDialog({
  open,
  onOpenChange,
  fixedPart,
  fixedAsset,
  onCreated,
}: InstallPartDialogProps) {
  const partsQ = useAsync(() => sparePartService.all(), []);
  const assetsQ = useAsync(() => assetService.all(), []);

  const [partId, setPartId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [repairRef, setRepairRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPartId(fixedPart?.id ?? "");
      setAssetId(fixedAsset?.id ?? "");
      setQuantity("1");
      setRepairRef("");
    }
  }, [open, fixedPart, fixedAsset]);

  const parts = partsQ.data ?? [];
  const assets = assetsQ.data ?? [];
  const canSubmit = Boolean(partId && assetId) && Number(quantity) >= 1;

  const submit = async () => {
    const part = fixedPart ?? parts.find((p) => p.id === partId);
    const asset = fixedAsset ?? assets.find((a) => a.id === assetId);
    if (!part || !asset) return;

    setSubmitting(true);
    try {
      const payload: PartInstallation = {
        id: `pin-${Date.now()}`,
        partId: part.id,
        partNumber: part.partNumber,
        partName: part.name,
        assetId: asset.id,
        assetTag: asset.assetTag,
        assetName: asset.name,
        quantity: Math.max(1, Number(quantity) || 1),
        installedBy: { id: currentUser.id, name: currentUser.name },
        installedAt: new Date().toISOString(),
        repairTicketNumber: repairRef.trim() || undefined,
      };
      await partInstallationService.create(payload);
      toast.success(`Logged ${part.name} → ${asset.assetTag}`);
      onCreated?.();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log part installation</DialogTitle>
          <DialogDescription>
            Record a spare part being fitted to a device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Part</Label>
            {fixedPart ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                {fixedPart.name}{" "}
                <span className="text-muted-foreground">· {fixedPart.partNumber}</span>
              </div>
            ) : (
              <Select value={partId} onValueChange={setPartId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a part" />
                </SelectTrigger>
                <SelectContent>
                  {parts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.partNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Device</Label>
            {fixedAsset ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                {fixedAsset.assetTag}{" "}
                <span className="text-muted-foreground">· {fixedAsset.name}</span>
              </div>
            ) : (
              <Select value={assetId} onValueChange={setAssetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.assetTag} · {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Quantity</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Repair ref (optional)</Label>
              <Input
                placeholder="RPR-7300"
                value={repairRef}
                onChange={(e) => setRepairRef(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit} loading={submitting}>
            Log installation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
