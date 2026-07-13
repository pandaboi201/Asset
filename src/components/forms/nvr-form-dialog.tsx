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
  ipAddress: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Enter a valid IPv4 address"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  macAddress: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  channelsTotal: z.coerce.number().optional(),
  storageTotalTb: z.coerce.number().optional(),
  recordingRetentionDays: z.coerce.number().optional(),
  firmwareVersion: z.string().optional(),
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
      ipAddress: "",
      username: "",
      password: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      macAddress: "",
      location: "Unknown",
      status: "online",
      channelsTotal: 16,
      storageTotalTb: 8,
      recordingRetentionDays: 30,
      firmwareVersion: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (nvr) {
        reset({
          name: nvr.name,
          manufacturer: nvr.manufacturer,
          model: nvr.model,
          serialNumber: nvr.serialNumber || "",
          macAddress: nvr.macAddress || "",
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
          ipAddress: "",
          username: "",
          password: "",
          manufacturer: "",
          model: "",
          serialNumber: "",
          macAddress: "",
          location: "Unknown",
          status: "online",
          channelsTotal: 16,
          storageTotalTb: 8,
          recordingRetentionDays: 30,
          firmwareVersion: "",
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
      if (data.serialNumber) setValue("serialNumber", data.serialNumber);
      if (data.macAddress) setValue("macAddress", data.macAddress);
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
        toast.info("Fetching device details from API...");
        
        let apiData: any = {};
        try {
          const response = await fetch("/api/isapi/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              ipAddress: values.ipAddress, 
              username: values.username, 
              password: values.password 
            })
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to connect to NVR API");
          }
          apiData = data;
        } catch (apiError: any) {
          throw new Error("API Fetch failed: " + apiError.message + ". Please check credentials.");
        }

        await nvrService.create({
          id: `nvr-${Date.now()}`,
          ...values,
          manufacturer: apiData.manufacturer || values.manufacturer || "Unknown",
          model: apiData.model || values.model || "Unknown",
          serialNumber: apiData.serialNumber || values.serialNumber || "",
          macAddress: apiData.macAddress || values.macAddress || "",
          location: values.location || "Unknown",
          status: values.status || "online",
          firmwareVersion: apiData.firmwareVersion || values.firmwareVersion || "Unknown",
          channelsTotal: apiData.channelsTotal || values.channelsTotal || 16,
          storageTotalTb: apiData.storageTotalTb || values.storageTotalTb || 0,
          recordingRetentionDays: values.recordingRetentionDays || 30,
          channelsUsed: 0,
          storageUsedTb: 0,
          installedDate: now,
          connectedCameraIds: "[]",
        } as unknown as Nvr);
        toast.success(`Recorder ${values.name} added successfully`);
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
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Username" required error={errors.username?.message}>
          <Input placeholder="admin" {...register("username")} />
        </FormField>
        <FormField label="Password" required error={errors.password?.message}>
          <Input type="password" placeholder="••••••••" {...register("password")} />
        </FormField>
      </div>

      {!isEdit && (
        <p className="text-sm text-muted-foreground pt-4 pb-2">
          Other details (Manufacturer, Model, Storage, etc.) will be automatically fetched from the NVR API upon submission.
        </p>
      )}

      {isEdit && (
        <>
          <div className="flex justify-end pt-2 pb-4">
            <Button type="button" variant="secondary" size="sm" onClick={handleTestConnection} disabled={isTesting}>
              {isTesting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Test Connection & Auto-Fill
            </Button>
          </div>
          
          <FormField label="Manufacturer" error={errors.manufacturer?.message}>
            <Input placeholder="Hikvision" {...register("manufacturer")} />
          </FormField>
          <FormField label="Model" error={errors.model?.message}>
            <Input placeholder="DS-7616NI-K2" {...register("model")} />
          </FormField>
          <FormField label="Serial Number" error={errors.serialNumber?.message}>
            <Input placeholder="ABC123456789" {...register("serialNumber")} />
          </FormField>
          <FormField label="MAC Address" error={errors.macAddress?.message}>
            <Input placeholder="00:11:22:33:44:55" {...register("macAddress")} />
          </FormField>
          <FormField label="Location" error={errors.location?.message}>
            <Input placeholder="Server Room A" {...register("location")} />
          </FormField>
          <FormField label="Firmware" error={errors.firmwareVersion?.message}>
            <Input placeholder="v1.0.0" {...register("firmwareVersion")} />
          </FormField>
          
          <FormField label="Total Channels" error={errors.channelsTotal?.message}>
            <Input type="number" {...register("channelsTotal")} />
          </FormField>
          <FormField label="Total Storage (TB)" error={errors.storageTotalTb?.message}>
            <Input type="number" step="0.1" {...register("storageTotalTb")} />
          </FormField>
          <FormField label="Retention (Days)" error={errors.recordingRetentionDays?.message}>
            <Input type="number" {...register("recordingRetentionDays")} />
          </FormField>
          
          <FormField label="Status" error={errors.status?.message}>
            <FormSelect
              control={control}
              name="status"
              placeholder="Select status"
              capitalize
              options={STATUSES.map((s) => ({ label: s, value: s }))}
            />
          </FormField>
        </>
      )}
    </FormDialogShell>
  );
}
