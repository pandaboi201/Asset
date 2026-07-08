import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { Priority, RepairTicket } from "@/types";
import { assetService, repairService, userService } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { FormDialogShell, FormField, FormSelect } from "@/components/shared/form";

const PRIORITIES = ["low", "medium", "high", "critical"];
const SLA_OPTIONS = ["24", "48", "72", "96"];
const UNASSIGNED = "none";

const schema = z.object({
  assetId: z.string().min(1, "Select a device"),
  issueSummary: z.string().min(3, "Describe the issue"),
  priority: z.string().min(1, "Select a priority"),
  reportedById: z.string().min(1, "Select the reporter"),
  technicianId: z.string().optional(),
  slaHours: z.string().min(1, "Select an SLA"),
});

type Values = z.infer<typeof schema>;

export function RepairFormDialog({
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
  const userOptions = useMemo(
    () => (usersQ.data ?? []).map((u) => ({ label: `${u.name} · ${u.department}`, value: u.id })),
    [usersQ.data],
  );
  const techOptions = useMemo(
    () => [
      { label: "Unassigned", value: UNASSIGNED },
      ...(usersQ.data ?? [])
        .filter((u) => ["technician", "manager"].includes(u.role))
        .map((u) => ({ label: u.name, value: u.id })),
    ],
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
      assetId: "",
      issueSummary: "",
      priority: "medium",
      reportedById: "",
      technicianId: UNASSIGNED,
      slaHours: "48",
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    const asset = (assetsQ.data ?? []).find((a) => a.id === values.assetId);
    const reporter = (usersQ.data ?? []).find((u) => u.id === values.reportedById);
    if (!asset || !reporter) return;
    const tech =
      values.technicianId && values.technicianId !== UNASSIGNED
        ? (usersQ.data ?? []).find((u) => u.id === values.technicianId)
        : null;

    await repairService.create({
      id: `rpr-${Date.now()}`,
      ticketNumber: `RPR-${Date.now().toString().slice(-5)}`,
      assetTag: asset.assetTag,
      assetName: asset.name,
      issueSummary: values.issueSummary,
      reportedBy: { id: reporter.id, name: reporter.name, avatarUrl: reporter.avatarUrl },
      assignedTechnician: tech
        ? { id: tech.id, name: tech.name, avatarUrl: tech.avatarUrl }
        : null,
      status: "reported",
      priority: values.priority as Priority,
      reportedAt: new Date().toISOString(),
      resolvedAt: null,
      slaHours: Number(values.slaHours),
    } as RepairTicket);

    toast.success(`Repair ticket opened for ${asset.assetTag}`);
    onCreated?.();
    onOpenChange(false);
  });

  return (
    <FormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="New Repair Ticket"
      description="Log a fault and route it to a technician."
      formId="repair-form"
      onSubmit={submit}
      submitLabel="Open ticket"
      submitting={isSubmitting}
    >
      <FormField label="Device" required full error={errors.assetId?.message}>
        <FormSelect control={control} name="assetId" placeholder="Select a device" options={assetOptions} />
      </FormField>
      <FormField label="Issue summary" required full error={errors.issueSummary?.message}>
        <Input placeholder="e.g. Screen flickering intermittently" {...register("issueSummary")} />
      </FormField>
      <FormField label="Reported by" required error={errors.reportedById?.message}>
        <FormSelect control={control} name="reportedById" placeholder="Select reporter" options={userOptions} />
      </FormField>
      <FormField label="Technician" error={errors.technicianId?.message}>
        <FormSelect control={control} name="technicianId" placeholder="Assign to" options={techOptions} />
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
      <FormField label="SLA (hours)" required error={errors.slaHours?.message}>
        <FormSelect
          control={control}
          name="slaHours"
          placeholder="Select SLA"
          options={SLA_OPTIONS.map((s) => ({ label: `${s}h`, value: s }))}
        />
      </FormField>
    </FormDialogShell>
  );
}
