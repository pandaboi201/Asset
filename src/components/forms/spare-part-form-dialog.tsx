import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { SparePart, SparePartStatus } from "@/types";
import { sparePartService } from "@/services";
import { SPARE_PART_CATEGORY_OPTIONS } from "@/config/constants";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { FormDialogShell, FormField, FormSelect } from "@/components/shared/form";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  partNumber: z.string().min(2, "Part number is required"),
  category: z.string().min(1, "Select a category"),
  quantity: z.coerce.number().int().min(0, "Must be 0 or more"),
  reorderLevel: z.coerce.number().int().min(0, "Must be 0 or more"),
  supplier: z.string().min(1, "Supplier is required"),
  location: z.string().min(1, "Location is required"),
  compatibleWith: z.string().optional(),
});

type Values = z.infer<typeof schema>;

function statusFor(qty: number, reorder: number): SparePartStatus {
  if (qty === 0) return "out-of-stock";
  if (qty <= reorder) return "low-stock";
  return "in-stock";
}

export function SparePartFormDialog({
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
      partNumber: "",
      category: "",
      quantity: 0,
      reorderLevel: 5,
      supplier: "",
      location: "",
      compatibleWith: "",
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    await sparePartService.create({
      id: `spp-${Date.now()}`,
      partNumber: values.partNumber,
      name: values.name,
      category: values.category,
      compatibleWith: (values.compatibleWith ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      quantity: values.quantity,
      reorderLevel: values.reorderLevel,
      supplier: values.supplier,
      location: values.location,
      status: statusFor(values.quantity, values.reorderLevel),
      updatedAt: new Date().toISOString(),
    } as SparePart);
    toast.success(`${values.name} added`);
    onCreated?.();
    onOpenChange(false);
  });

  return (
    <FormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Add Spare Part"
      description="Register a component used for repairs and swaps."
      formId="spare-part-form"
      onSubmit={submit}
      submitLabel="Create part"
      submitting={isSubmitting}
    >
      <FormField label="Part name" required full error={errors.name?.message}>
        <Input placeholder="e.g. Laptop Battery (Li-Ion)" {...register("name")} />
      </FormField>
      <FormField label="Part number" required error={errors.partNumber?.message}>
        <Input placeholder="PN-9100" {...register("partNumber")} />
      </FormField>
      <FormField label="Category" required error={errors.category?.message}>
        <FormSelect
          control={control}
          name="category"
          placeholder="Select category"
          options={SPARE_PART_CATEGORY_OPTIONS.map((c) => ({ label: c, value: c }))}
        />
      </FormField>
      <FormField label="Quantity" required error={errors.quantity?.message}>
        <Input type="number" min={0} {...register("quantity")} />
      </FormField>
      <FormField label="Reorder level" required error={errors.reorderLevel?.message}>
        <Input type="number" min={0} {...register("reorderLevel")} />
      </FormField>
      <FormField label="Supplier" required error={errors.supplier?.message}>
        <Input placeholder="Parts Direct" {...register("supplier")} />
      </FormField>
      <FormField label="Location" required error={errors.location?.message}>
        <Input placeholder="Bin A-12" {...register("location")} />
      </FormField>
      <FormField
        label="Compatible with (comma separated)"
        full
        error={errors.compatibleWith?.message}
      >
        <Input placeholder="MacBook Pro 14&quot;, ThinkPad X1" {...register("compatibleWith")} />
      </FormField>
    </FormDialogShell>
  );
}
