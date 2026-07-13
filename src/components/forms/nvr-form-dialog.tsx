import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { Nvr } from "@/types";
import { nvrService } from "@/services";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { FormDialogShell, FormField, FormSelect } from "@/components/shared/form";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const STATUSES = ["online", "offline", "maintenance"];

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  model: z.string().min(1, "Model is required"),
  location: z.string().min(2, "Location is required"),
  ipAddress: z
    .string()
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Enter a valid IPv4 address"),
  status: z.string().min(1, "Select a status"),
  channelsTotal: z.coerce.number().min(1, "Must be at least 1"),
  storageTotalTb: z.coerce.number().min(1, "Must be at least 1"),
  recordingRetentionDays: z.coerce.number().min(1, "Must be at least 1"),
  firmwareVersion: z.string().min(1, "Firmware version is required"),
  username: z.string().optional(),
  password: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function NvrFormDialog({
  open,
  onOpenChange,
  nvr,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nvr?: Nvr | null;
  onCreated?: () => void;
}) {
  const isEdit = Boolean(nvr);
  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      manufacturer: "",
      model: "",
      location: "",
      ipAddress: "",
      status: "online",
      channelsTotal: 16,
      storageTotalTb: 8,
      recordingRetentionDays: 30,
      firmwareVersion: "v1.0.0",
    },
  });

  useEffect(() => {
    if (open) {
      if (nvr) {
        reset({
          name: nvr.name,
          manufacturer: nvr.manufacturer,
          model: nvr.model,
          location: nvr.location,
          ipAddress: nvr.ipAddress,
          status: nvr.status,
          channelsTotal: nvr.channelsTotal,
          storageTotalTb: nvr.storageTotalTb,
          recordingRetentionDays: nvr.recordingRetentionDays,
          firmwareVersion: nvr.firmwareVersion,
          username: nvr.username || "",
          password: nvr.password || "",
        });
      } else {
        reset({
          name: "",
          manufacturer: "",
          model: "",
          location: "",
          ipAddress: "",
          status: "online",
          channelsTotal: 16,
          storageTotalTb: 8,
          recordingRetentionDays: 30,
          firmwareVersion: "v1.0.0",
          username: "",
          password: "",
        });
      }
    }
  }, [open, nvr, reset]);

  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    const { ipAddress, username, password } = getValues();
    if (!ipAddress || !username || !password) {
      toast.error("Please fill in IP address, username, and password first.");
      return;
    }
    
    setIsTesting(true);
    try {
      const response = await fetch("/api/isapi/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress, username, password })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to test connection");
      
      if (data.model) setValue("model", data.model);
      if (data.manufacturer) setValue("manufacturer", data.manufacturer);
      if (data.firmwareVersion) setValue("firmwareVersion", data.firmwareVersion);
      if (data.channelsTotal) setValue("channelsTotal", data.channelsTotal);
      if (data.storageTotalTb) setValue("storageTotalTb", data.storageTotalTb);
      if (data.recordingRetentionDays) setValue("recordingRetentionDays", data.recordingRetentionDays);
      
      toast.success("Connection successful! Data auto-filled.");
    } catch (e: any) {
      toast.error("Connection failed: " + e.message);
    } finally {
      setIsTesting(false);
    }
  };

  const submit = handleSubmit(async (values) => {
    const now = new Date().toISOString();
    try {
      if (isEdit && nvr) {
        await nvrService.update(nvr.id, {
          ...values,
        });
        toast.success(`Recorder ${values.name} updated`);
      } else {
        await nvrService.create({
          id: `nvr-${Date.now()}`,
          ...values,
          channelsUsed: 0,
          storageUsedTb: 0,
          installedDate: now,
          connectedCameraIds: "[]",
        } as unknown as Nvr);
        toast.success(`Recorder ${values.name} added`);
      }
      onCreated?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    }
  });

  return (
    <FormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Recorder" : "Add Recorder"}
      description={isEdit ? "Update NVR details." : "Register a new NVR."}
      formId="nvr-form"
      onSubmit={submit}
      submitLabel={isEdit ? "Save changes" : "Add recorder"}
      submitting={isSubmitting}
    >
      <FormField label="Name" required error={errors.name?.message}>
        <Input placeholder="NVR-01" {...register("name")} />
      </FormField>
      <FormField label="IP address" required error={errors.ipAddress?.message}>
        <Input placeholder="10.20.1.100" {...register("ipAddress")} />
      </FormField>
      <FormField label="Manufacturer" required error={errors.manufacturer?.message}>
        <Input placeholder="Hikvision" {...register("manufacturer")} />
      </FormField>
      <FormField label="Model" required error={errors.model?.message}>
        <Input placeholder="DS-7616NI-K2" {...register("model")} />
      </FormField>
      <FormField label="Location" required error={errors.location?.message}>
        <Input placeholder="Server Room A" {...register("location")} />
      </FormField>
      <FormField label="Firmware" required error={errors.firmwareVersion?.message}>
        <Input placeholder="v1.0.0" {...register("firmwareVersion")} />
      </FormField>
      
      <FormField label="Total Channels" required error={errors.channelsTotal?.message}>
        <Input type="number" {...register("channelsTotal")} />
      </FormField>
      <FormField label="Total Storage (TB)" required error={errors.storageTotalTb?.message}>
        <Input type="number" step="0.1" {...register("storageTotalTb")} />
      </FormField>
      <FormField label="Retention (Days)" required error={errors.recordingRetentionDays?.message}>
        <Input type="number" {...register("recordingRetentionDays")} />
      </FormField>
      
      <FormField label="Status" required error={errors.status?.message}>
        <FormSelect
          control={control}
          name="status"
          placeholder="Select status"
          capitalize
          options={STATUSES.map((s) => ({ label: s, value: s }))}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Username" error={errors.username?.message}>
          <Input placeholder="admin" {...register("username")} />
        </FormField>
        <FormField label="Password" error={errors.password?.message}>
          <Input type="password" placeholder="••••••••" {...register("password")} />
        </FormField>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="button" variant="secondary" size="sm" onClick={handleTestConnection} disabled={isTesting}>
          {isTesting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Test Connection & Auto-Fill
        </Button>
      </div>
    </FormDialogShell>
  );
}
