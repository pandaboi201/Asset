import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAsync } from "@/hooks/use-async";

import type { Nvr } from "@/types";
import { nvrService, nvrHistoryService } from "@/services";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { FormDialogShell, FormField, FormSelect } from "@/components/shared/form";

const schema = z.object({
  action: z.enum(["Moved", "Uninstalled", "Replaced", "Installed", "Sent to Inventory"]),
  newStatus: z.enum(["installed", "inventory", "decommissioned"]),
  newLocation: z.string().optional(),
  replacementDeviceId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function NvrMoveDialog({
  open,
  onOpenChange,
  nvr,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nvr: Nvr | null;
  onUpdated: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      action: "Moved",
      newStatus: "installed",
      newLocation: "",
      replacementDeviceId: "",
      notes: "",
    },
  });

  const inventoryQ = useAsync(async () => {
    const all = await nvrService.all();
    return all.filter(n => n.installationStatus === "inventory");
  }, []);

  const selectedStatus = watch("newStatus");

  useEffect(() => {
    if (nvr && open) {
      reset({
        action: "Moved",
        newStatus: nvr.installationStatus as "installed" | "inventory" | "decommissioned" || "installed",
        newLocation: nvr.location || "",
        notes: "",
      });
    }
  }, [nvr, open, reset]);

  const submit = handleSubmit(async (values) => {
    if (!nvr) return;
    try {
      const isInventory = values.newStatus === "inventory";
      const finalLocation = isInventory ? "Inventory" : (values.newLocation || nvr.location);
      
      let historyNotes = values.notes || "";
      if (values.action === "Replaced" && values.replacementDeviceId) {
        const replacement = inventoryQ.data?.find(n => n.id === values.replacementDeviceId);
        if (replacement) {
          historyNotes = `Replaced by ${replacement.name} (SN: ${replacement.serialNumber || 'N/A'}). ${historyNotes}`.trim();
          
          await nvrService.update(replacement.id, {
            installationStatus: "installed",
            location: finalLocation,
            status: "online"
          });
        }
      }

      // 1. Log History
      await nvrHistoryService.create({
        id: `nvrhist-${Date.now()}`,
        nvrId: nvr.id,
        nvrName: nvr.name,
        action: values.action,
        fromLocation: nvr.location,
        toLocation: finalLocation,
        notes: historyNotes,
        date: new Date().toISOString(),
      });

      // 2. Update Old NVR
      await nvrService.update(nvr.id, {
        installationStatus: values.newStatus,
        location: finalLocation,
        status: isInventory ? "offline" : nvr.status,
      });

      toast.success("NVR updated and history logged");
      onUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to update NVR: " + error.message);
    }
  });

  if (!nvr) return null;

  return (
    <FormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Change Status / Location"
      description={`Record a movement, uninstallation, or status change for ${nvr.name}.`}
      formId="nvr-move-form"
      onSubmit={submit}
      submitLabel="Save changes"
      submitting={isSubmitting}
    >
      <FormField label="Action" required error={errors.action?.message}>
        <FormSelect
          control={control}
          name="action"
          placeholder="Select an action"
          options={[
            { label: "Moved Location", value: "Moved" },
            { label: "Replaced", value: "Replaced" },
            { label: "Sent to Inventory", value: "Sent to Inventory" },
            { label: "Installed from Inventory", value: "Installed" },
            { label: "Uninstalled / Decommissioned", value: "Uninstalled" },
          ]}
        />
      </FormField>

      <FormField label="New Status" required error={errors.newStatus?.message}>
        <FormSelect
          control={control}
          name="newStatus"
          placeholder="Select status"
          options={[
            { label: "Installed (Active)", value: "installed" },
            { label: "Inventory (Spare)", value: "inventory" },
            { label: "Decommissioned", value: "decommissioned" },
          ]}
        />
      </FormField>

      {selectedStatus === "installed" && (
        <FormField label="New Location" error={errors.newLocation?.message}>
          <Input placeholder="e.g. Server Room A" {...register("newLocation")} />
        </FormField>
      )}

      {watch("action") === "Replaced" && (
        <FormField label="Replacement NVR" error={errors.replacementDeviceId?.message}>
          <FormSelect
            control={control}
            name="replacementDeviceId"
            placeholder="Select an NVR from inventory"
            options={inventoryQ.data?.map(n => ({ label: `${n.name} (${n.model || 'Unknown'})`, value: n.id })) || []}
          />
        </FormField>
      )}

      <FormField label="Notes / Reason" error={errors.notes?.message}>
        <Input placeholder="Why was this action performed?" {...register("notes")} />
      </FormField>
    </FormDialogShell>
  );
}
