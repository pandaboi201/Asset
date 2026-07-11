import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { AssetCondition, DeviceIssue } from "@/types";
import { assetService, issueService, userService } from "@/services";
import { useAsync } from "@/hooks/use-async";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialogShell, FormField, FormSelect } from "@/components/shared/form";

const CONDITIONS = ["new", "good", "fair", "poor"];

const schema = z.object({
  assetId: z.string().min(1, "Select a device"),
  userId: z.string().min(1, "Select a recipient"),
  dueDate: z.string().min(1, "Select a due date"),
  condition: z.string().min(1, "Select the condition"),
  notes: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function IssueFormDialog({
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
    () =>
      (assetsQ.data ?? [])
        .filter((a) => a.status === "available" || a.status === "in-use")
        .map((a) => ({ label: `${a.assetTag} · ${a.name}`, value: a.id })),
    [assetsQ.data],
  );
  const userOptions = useMemo(
    () => (usersQ.data ?? []).map((u) => ({ label: `${u.name} · ${u.department}`, value: u.id })),
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
    defaultValues: { assetId: "", userId: "", dueDate: "", condition: "good", notes: "" },
  });

  useEffect(() => {
    if (open) {
      reset();
      assetsQ.refetch();
    }
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    const asset = (assetsQ.data ?? []).find((a) => a.id === values.assetId);
    const user = (usersQ.data ?? []).find((u) => u.id === values.userId);
    if (!asset || !user) return;

    await issueService.create({
      id: `iss-${Date.now()}`,
      reference: `ISS-${Date.now().toString().slice(-5)}`,
      assetTag: asset.assetTag,
      assetName: asset.name,
      issuedTo: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        department: user.department,
      },
      issuedBy: "IT Service Desk",
      issueDate: new Date().toISOString(),
      dueDate: new Date(values.dueDate).toISOString(),
      returnDate: null,
      status: "issued",
      condition: values.condition as AssetCondition,
      notes: values.notes?.trim() || undefined,
    } as DeviceIssue);

    toast.success(`${asset.assetTag} issued to ${user.name}`);
    onCreated?.();
    onOpenChange(false);
  });

  return (
    <FormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Issue Device"
      description="Check a device out to a team member."
      formId="issue-form"
      onSubmit={submit}
      submitLabel="Issue device"
      submitting={isSubmitting}
    >
      <FormField label="Device" required full error={errors.assetId?.message}>
        <FormSelect
          control={control}
          name="assetId"
          placeholder="Select a device"
          options={assetOptions}
        />
      </FormField>
      <FormField label="Issue to" required error={errors.userId?.message}>
        <FormSelect
          control={control}
          name="userId"
          placeholder="Select a person"
          options={userOptions}
        />
      </FormField>
      <FormField label="Due date" required error={errors.dueDate?.message}>
        <Input type="date" {...register("dueDate")} />
      </FormField>
      <FormField label="Condition" required error={errors.condition?.message}>
        <FormSelect
          control={control}
          name="condition"
          placeholder="Select condition"
          capitalize
          options={CONDITIONS.map((c) => ({ label: c, value: c }))}
        />
      </FormField>
      <FormField label="Notes" full error={errors.notes?.message}>
        <Textarea rows={3} placeholder="Optional notes..." {...register("notes")} />
      </FormField>
    </FormDialogShell>
  );
}
