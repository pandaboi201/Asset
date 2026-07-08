import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { MaintenanceTask, MaintenanceType, Priority } from "@/types";
import { assetService, maintenanceService, userService } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialogShell, FormField, FormSelect } from "@/components/shared/form";

const TYPES = ["preventive", "corrective", "inspection"];
const PRIORITIES = ["low", "medium", "high", "critical"];

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  assetId: z.string().min(1, "Select a device"),
  type: z.string().min(1, "Select a type"),
  priority: z.string().min(1, "Select a priority"),
  technicianId: z.string().min(1, "Assign a technician"),
  scheduledDate: z.string().min(1, "Pick a date"),
  description: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function MaintenanceFormDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const assetsQ = useAsync(() => assetService.all(), []);
  const usersQ = useAsync(() => userService.all(), []);

  const assetOptions = useMemo(
    () => (assetsQ.data ?? []).map((a) => ({ label: `${a.assetTag} · ${a.name}`, value: a.id })),
    [assetsQ.data],
  );
  const techOptions = useMemo(
    () =>
      (usersQ.data ?? [])
        .filter((u) => ["technician", "manager", "admin"].includes(u.role))
        .map((u) => ({ label: u.name, value: u.id })),
    [usersQ.data],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      assetId: "",
      type: "preventive",
      priority: "medium",
      technicianId: "",
      scheduledDate: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    const asset = (assetsQ.data ?? []).find((a) => a.id === values.assetId);
    const tech = (usersQ.data ?? []).find((u) => u.id === values.technicianId);
    if (!asset || !tech) return;

    await maintenanceService.create({
      id: `mnt-${Date.now()}`,
      reference: `MNT-${Date.now().toString().slice(-5)}`,
      assetTag: asset.assetTag,
      assetName: asset.name,
      title: values.title,
      type: values.type as MaintenanceType,
      status: "scheduled",
      priority: values.priority as Priority,
      assignedTo: { id: tech.id, name: tech.name, avatarUrl: tech.avatarUrl },
      scheduledDate: new Date(values.scheduledDate).toISOString(),
      completedDate: null,
      description:
        values.description?.trim() ||
        "Scheduled maintenance per the maintenance policy.",
    } as MaintenanceTask);

    toast.success(`Maintenance scheduled for ${asset.assetTag}`);
    onCreated?.();
    onOpenChange(false);
  });

  return (
    <FormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Schedule Maintenance"
      description="Plan a preventive or corrective maintenance task."
      formId="maintenance-form"
      onSubmit={submit}
      submitLabel="Schedule task"
      submitting={isSubmitting}
    >
      <FormField label="Task title" required full error={errors.title?.message}>
        <Input placeholder="e.g. Quarterly hardware inspection" {...register("title")} />
      </FormField>
      <FormField label="Device" required error={errors.assetId?.message}>
        <FormSelect control={control} name="assetId" placeholder="Select a device" options={assetOptions} />
      </FormField>
      <FormField label="Technician" required error={errors.technicianId?.message}>
        <FormSelect control={control} name="technicianId" placeholder="Assign to" options={techOptions} />
      </FormField>
      <FormField label="Type" required error={errors.type?.message}>
        <FormSelect
          control={control}
          name="type"
          placeholder="Select type"
          capitalize
          options={TYPES.map((t) => ({ label: t, value: t }))}
        />
      </FormField>
      <FormField label="Priority" required error={errors.priority?.message}>
        <FormSelect
          control={control}
          name="priority"
          placeholder="Select priority"
          capitalize
          options={PRIORITIES.map((p) => ({ label: p, value: p }))}
        />
      </FormField>
      <FormField label="Scheduled date" required full error={errors.scheduledDate?.message}>
        <Input type="date" {...register("scheduledDate")} />
      </FormField>
      <FormField label="Description" full error={errors.description?.message}>
        <Textarea rows={3} placeholder="Optional details..." {...register("description")} />
      </FormField>
    </FormDialogShell>
  );
}
