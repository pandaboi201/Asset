import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { CameraStatus, CctvCamera } from "@/types";
import { cctvService } from "@/services";
import { CCTV_ZONE_OPTIONS } from "@/data/cctv";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { FormDialogShell, FormField, FormSelect } from "@/components/shared/form";

const RESOLUTIONS = ["1080p", "4MP", "8MP", "12MP", "4K UHD"];
const STATUSES = ["online", "recording", "offline", "maintenance"];

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  location: z.string().min(2, "Location is required"),
  zone: z.string().min(1, "Select a zone"),
  ipAddress: z
    .string()
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Enter a valid IPv4 address"),
  model: z.string().min(1, "Model is required"),
  resolution: z.string().min(1, "Select a resolution"),
  status: z.string().min(1, "Select a status"),
});

type Values = z.infer<typeof schema>;

export function CameraFormDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      location: "",
      zone: "",
      ipAddress: "",
      model: "",
      resolution: "4MP",
      status: "online",
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    const now = new Date().toISOString();
    await cctvService.create({
      id: `cam-${Date.now()}`,
      name: values.name,
      location: values.location,
      zone: values.zone,
      ipAddress: values.ipAddress,
      model: values.model,
      resolution: values.resolution,
      status: values.status as CameraStatus,
      recording: values.status === "recording",
      storageUsedGb: 0,
      storageTotalGb: 2000,
      lastPing: now,
      installedDate: now,
      firmwareVersion: "v1.0.0",
      nvrId: null,
    } as CctvCamera);
    toast.success(`${values.name} added to the camera fleet`);
    onCreated?.();
    onOpenChange(false);
  });

  return (
    <FormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Add Camera"
      description="Register a new CCTV camera."
      formId="camera-form"
      onSubmit={submit}
      submitLabel="Add camera"
      submitting={isSubmitting}
    >
      <FormField label="Camera name" required error={errors.name?.message}>
        <Input placeholder="CAM-25" {...register("name")} />
      </FormField>
      <FormField label="IP address" required error={errors.ipAddress?.message}>
        <Input placeholder="10.20.1.50" {...register("ipAddress")} />
      </FormField>
      <FormField label="Location" required error={errors.location?.message}>
        <Input placeholder="Main Entrance North" {...register("location")} />
      </FormField>
      <FormField label="Zone" required error={errors.zone?.message}>
        <FormSelect
          control={control}
          name="zone"
          placeholder="Select zone"
          options={CCTV_ZONE_OPTIONS.map((z) => ({ label: z, value: z }))}
        />
      </FormField>
      <FormField label="Model" required error={errors.model?.message}>
        <Input placeholder="Axis P3268-LV" {...register("model")} />
      </FormField>
      <FormField label="Resolution" required error={errors.resolution?.message}>
        <FormSelect
          control={control}
          name="resolution"
          placeholder="Select resolution"
          options={RESOLUTIONS.map((r) => ({ label: r, value: r }))}
        />
      </FormField>
      <FormField label="Status" required full error={errors.status?.message}>
        <FormSelect
          control={control}
          name="status"
          placeholder="Select status"
          capitalize
          options={STATUSES.map((s) => ({ label: s, value: s }))}
        />
      </FormField>
    </FormDialogShell>
  );
}
