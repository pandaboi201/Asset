import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { InventoryItem, InventoryStatus } from "@/types";
import { inventoryService } from "@/services";
import {
  INVENTORY_CATEGORY_OPTIONS,
  INVENTORY_WAREHOUSE_OPTIONS,
} from "@/data/inventory";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { FormDialogShell, FormField, FormSelect } from "@/components/shared/form";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  sku: z.string().min(2, "SKU is required"),
  category: z.string().min(1, "Select a category"),
  warehouse: z.string().min(1, "Select a warehouse"),
  quantity: z.coerce.number().int().min(0, "Must be 0 or more"),
  reorderLevel: z.coerce.number().int().min(0, "Must be 0 or more"),
  location: z.string().min(1, "Bin / location is required"),
  supplier: z.string().min(1, "Supplier is required"),
});

type Values = z.infer<typeof schema>;

function statusFor(qty: number, reorder: number): InventoryStatus {
  if (qty === 0) return "out-of-stock";
  if (qty <= reorder) return "low-stock";
  return "in-stock";
}

export function InventoryFormDialog({
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
      sku: "",
      category: "",
      warehouse: "",
      quantity: 0,
      reorderLevel: 10,
      location: "",
      supplier: "",
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    const now = new Date().toISOString();
    await inventoryService.create({
      ...values,
      id: `inv-${Date.now()}`,
      status: statusFor(values.quantity, values.reorderLevel),
      lastRestocked: now,
      updatedAt: now,
    } as InventoryItem);
    toast.success(`${values.name} added to inventory`);
    onCreated?.();
    onOpenChange(false);
  });

  return (
    <FormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Add Inventory Item"
      description="Register a new consumable or stock item."
      formId="inventory-form"
      onSubmit={submit}
      submitLabel="Create item"
      submitting={isSubmitting}
    >
      <FormField label="Item name" required full error={errors.name?.message}>
        <Input placeholder="e.g. USB-C Charger 96W" {...register("name")} />
      </FormField>
      <FormField label="SKU" required error={errors.sku?.message}>
        <Input placeholder="SKU-4001" {...register("sku")} />
      </FormField>
      <FormField label="Category" required error={errors.category?.message}>
        <FormSelect
          control={control}
          name="category"
          placeholder="Select category"
          options={INVENTORY_CATEGORY_OPTIONS.map((c) => ({ label: c, value: c }))}
        />
      </FormField>
      <FormField label="Quantity" required error={errors.quantity?.message}>
        <Input type="number" min={0} {...register("quantity")} />
      </FormField>
      <FormField label="Reorder level" required error={errors.reorderLevel?.message}>
        <Input type="number" min={0} {...register("reorderLevel")} />
      </FormField>
      <FormField label="Warehouse" required error={errors.warehouse?.message}>
        <FormSelect
          control={control}
          name="warehouse"
          placeholder="Select warehouse"
          options={INVENTORY_WAREHOUSE_OPTIONS.map((w) => ({ label: w, value: w }))}
        />
      </FormField>
      <FormField label="Bin / location" required error={errors.location?.message}>
        <Input placeholder="Aisle 3-B" {...register("location")} />
      </FormField>
      <FormField label="Supplier" required full error={errors.supplier?.message}>
        <Input placeholder="CDW" {...register("supplier")} />
      </FormField>
    </FormDialogShell>
  );
}
