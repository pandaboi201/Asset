import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { CameraStatus, CctvCamera } from "@/types";
import { cctvService } from "@/services";
import { CCTV_ZONE_OPTIONS } from "@/config/constants";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { FormDialogShell, FormField, FormSelect } from "@/components/shared/form";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

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
  username: z.string().optional(),
  password: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function CameraFormDialog({
  open,
  onOpenChange,
  camera,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  camera?: CctvCamera | null;
  onCreated?: () => void;
}) {
  const isEdit = Boolean(camera);
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
      location: "",
      zone: "",
      ipAddress: "",
      model: "",
      resolution: "4MP",
      status: "online",
    },
  });

  useEffect(() => {
    if (open) {
      if (camera) {
        reset({
          name: camera.name,
          location: camera.location,
          zone: camera.zone,
          ipAddress: camera.ipAddress,
          model: camera.model,
          resolution: camera.resolution,
          status: camera.status,
          username: camera.username || "",
          password: camera.password || "",
        });
      } else {
        reset({
          name: "",
          location: "",
          zone: "",
          ipAddress: "",
          model: "",
          resolution: "4MP",
          status: "online",
          username: "",
          password: "",
        });
      }
    }
  }, [open, camera, reset]);

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
      if (isEdit && camera) {
        await cctvService.update(camera.id, {
          ...values,
          recording: values.status === "recording",
        });
        toast.success(`${values.name} updated successfully`);
      } else {
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
      title={isEdit ? "Edit Camera" : "Add Camera"}
      description={isEdit ? "Update camera configuration." : "Register a new CCTV camera."}
      formId="camera-form"
      onSubmit={submit}
      submitLabel={isEdit ? "Save changes" : "Add camera"}
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
