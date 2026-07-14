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
  installationStatus: z.enum(["installed", "inventory"]).default("installed"),
  ipAddress: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
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
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      installationStatus: "installed",
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
          installationStatus: (nvr.installationStatus as "installed" | "inventory") || "installed",
          manufacturer: nvr.manufacturer,
          model: nvr.model,
          serialNumber: nvr.serialNumber || "",
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
          installationStatus: "installed",
          ipAddress: "",
          username: "",
          password: "",
          manufacturer: "",
          model: "",
          serialNumber: "",
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

  const installStatus = watch("installationStatus");

  const handleTestConnection = async () => {
    const values = getValues();
    const { ipAddress, username, password } = values;
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
      if (values.installationStatus === "installed") {
        if (!values.ipAddress || !/^(\d{1,3}\.){3}\d{1,3}$/.test(values.ipAddress)) {
          setError("ipAddress", { message: "Valid IPv4 address is required for installed NVRs" });
          return;
        }
        if (!values.username) {
          setError("username", { message: "Username is required" });
          return;
        }
        if (!values.password) {
          setError("password", { message: "Password is required" });
          return;
        }
      }

      if (isEdit && nvr) {
        await nvrService.update(nvr.id, {
          ...values,
          ipAddress: values.ipAddress || "0.0.0.0",
        });
        toast.success(`Recorder ${values.name} updated`);
      } else {
        let apiData: any = {};
        
        if (values.installationStatus === "installed") {
          toast.info("Fetching device details from API...");
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
        }

        await nvrService.create({
          id: `nvr-${Date.now()}`,
          name: values.name,
          manufacturer: apiData.manufacturer || values.manufacturer || "Unknown",
          model: apiData.model || values.model || "Unknown",
          serialNumber: apiData.serialNumber || values.serialNumber || "",
          location: values.location || "Unknown",
          ipAddress: values.ipAddress || "0.0.0.0",
          status: values.installationStatus === "inventory" ? "offline" : (values.status || "online"),
          installationStatus: values.installationStatus,
          channelsTotal: apiData.channelsTotal || values.channelsTotal || 16,
          channelsUsed: apiData.channelsUsed || 0,
          storageTotalTb: apiData.storageTotalTb || values.storageTotalTb || 8,
          storageUsedTb: apiData.storageUsedTb || 0,
          recordingRetentionDays: apiData.recordingRetentionDays || values.recordingRetentionDays || 30,
          firmwareVersion: apiData.firmwareVersion || values.firmwareVersion || "v1.0",
          installedDate: now,
          username: values.username || "",
          password: values.password || "",
          connectedCameraIds: "[]",
          alerts: "[]",
          supportedEvents: "[]"
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
      <FormField label="NVR Name / ID" required error={errors.name?.message}>
        <Input placeholder="NVR-01" {...register("name")} />
      </FormField>

      <FormField label="Status" required error={errors.installationStatus?.message}>
        <FormSelect
          control={control}
          name="installationStatus"
          placeholder="Select status"
          options={[
            { label: "Installed (Active)", value: "installed" },
            { label: "Inventory (Spare)", value: "inventory" },
          ]}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={installStatus === "inventory" ? "Warehouse / Box" : "Location"} required error={errors.location?.message}>
          <Input placeholder={installStatus === "inventory" ? "Shelf B1" : "Server Room A"} {...register("location")} />
        </FormField>
        <FormField label="IP Address" required={installStatus === "installed"} error={errors.ipAddress?.message}>
          <Input placeholder="192.168.1.100" {...register("ipAddress")} disabled={installStatus === "inventory"} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Username" required={installStatus === "installed"} error={errors.username?.message}>
          <Input placeholder="admin" {...register("username")} disabled={installStatus === "inventory"} />
        </FormField>
        <FormField label="Password" required={installStatus === "installed"} error={errors.password?.message}>
          <Input type="password" placeholder="••••••••" {...register("password")} disabled={installStatus === "inventory"} />
        </FormField>
      </div>

      {!isEdit && installStatus === "installed" && (
        <Button 
          type="button" 
          variant="secondary" 
          className="w-full" 
          onClick={handleTestConnection}
          disabled={isTesting}
        >
          {isTesting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : "Test Connection & Auto-fill"}
        </Button>
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
