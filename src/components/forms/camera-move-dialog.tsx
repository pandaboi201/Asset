import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAsync } from "@/hooks/use-async";

import type { CctvCamera } from "@/types";
import { cctvService, cameraHistoryService } from "@/services";
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

export function CameraMoveDialog({
  open,
  onOpenChange,
  camera,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  camera: CctvCamera | null;
  onUpdated: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
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
    const all = await cctvService.all();
    return all.filter(c => c.installationStatus === "inventory");
  }, []);

  const selectedStatus = watch("newStatus");

  useEffect(() => {
    if (camera && open) {
      reset({
        action: "Moved",
        newStatus: camera.installationStatus as "installed" | "inventory" | "decommissioned" || "installed",
        newLocation: camera.location || "",
        notes: "",
      });
    }
  }, [camera, open, reset]);

  const submit = handleSubmit(async (values) => {
    if (!camera) return;
    try {
      const isInventory = values.newStatus === "inventory";
      const finalLocation = isInventory ? "Inventory" : (values.newLocation || camera.location);
      
      let historyNotes = values.notes || "";
      if (values.action === "Replaced" && values.replacementDeviceId) {
        const replacement = inventoryQ.data?.find(c => c.id === values.replacementDeviceId);
        if (replacement) {
          historyNotes = `Replaced by ${replacement.name} (SN: ${replacement.serialNumber || 'N/A'}). ${historyNotes}`.trim();
          
          await cctvService.update(replacement.id, {
            installationStatus: "installed",
            location: finalLocation,
            zone: camera.zone,
            status: "online",
            nvrId: camera.nvrId
          });
        }
      }

      // 1. Log History
      await cameraHistoryService.create({
        id: `hist-${Date.now()}`,
        cameraId: camera.id,
        cameraName: camera.name,
        action: values.action,
        fromLocation: camera.location,
        toLocation: finalLocation,
        notes: historyNotes,
        date: new Date().toISOString(),
      });

      // 2. Update Old Camera
      await cctvService.update(camera.id, {
        installationStatus: values.newStatus,
        location: finalLocation,
        zone: isInventory ? "Unassigned" : camera.zone,
        status: isInventory ? "offline" : camera.status,
        nvrId: null
      });

      toast.success("Camera updated and history logged");
      onUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to update camera: " + error.message);
    }
  });

  if (!camera) return null;

  return (
    <FormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Change Status / Location"
      description={`Record a movement, uninstallation, or status change for ${camera.name}.`}
      formId="camera-move-form"
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
          <Input placeholder="e.g. 1st Floor Lobby" {...register("newLocation")} />
        </FormField>
      )}

      {watch("action") === "Replaced" && (
        <FormField label="Replacement Camera" error={errors.replacementDeviceId?.message}>
          <FormSelect
            control={control}
            name="replacementDeviceId"
            placeholder="Select a camera from inventory"
            options={inventoryQ.data?.map(c => ({ label: `${c.name} (${c.model || 'Unknown'})`, value: c.id })) || []}
          />
        </FormField>
      )}

      <FormField label="Notes / Reason" error={errors.notes?.message}>
        <Input placeholder="Why was this action performed?" {...register("notes")} />
      </FormField>
    </FormDialogShell>
  );
}
