import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inventorySchema = z.object({
  sku: z.string().min(2, "SKU is required"),
  name: z.string().min(2, "Name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.coerce.number().min(0, "Must be 0 or more"),
  reorderLevel: z.coerce.number().min(0, "Must be 0 or more"),
  warehouse: z.string().min(1, "Warehouse is required"),
  location: z.string().min(1, "Bin/location is required"),
  supplier: z.string().min(1, "Supplier is required"),
});

export type InventoryFormValues = z.infer<typeof inventorySchema>;

interface InventoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InventoryFormValues) => Promise<void> | void;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function InventoryFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: InventoryFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      sku: "",
      name: "",
      category: "",
      quantity: 0,
      reorderLevel: 10,
      warehouse: "",
      location: "",
      supplier: "",
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-5">
          <DialogTitle>Add Inventory Item</DialogTitle>
          <DialogDescription>
            Register a new consumable or stock item.
          </DialogDescription>
        </DialogHeader>

        <form
          id="inventory-form"
          onSubmit={submit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Item name" error={errors.name?.message}>
                <Input placeholder="USB-C Charger 96W" {...register("name")} />
              </Field>
            </div>
            <Field label="SKU" error={errors.sku?.message}>
              <Input placeholder="SKU-4100" {...register("sku")} />
            </Field>
            <Field label="Category" error={errors.category?.message}>
              <Input placeholder="Chargers" {...register("category")} />
            </Field>
            <Field label="Quantity on hand" error={errors.quantity?.message}>
              <Input type="number" min={0} {...register("quantity")} />
            </Field>
            <Field label="Reorder level" error={errors.reorderLevel?.message}>
              <Input type="number" min={0} {...register("reorderLevel")} />
            </Field>
            <Field label="Warehouse" error={errors.warehouse?.message}>
              <Input placeholder="Central Warehouse" {...register("warehouse")} />
            </Field>
            <Field label="Bin / location" error={errors.location?.message}>
              <Input placeholder="Aisle 3-B" {...register("location")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Supplier" error={errors.supplier?.message}>
                <Input placeholder="CDW" {...register("supplier")} />
              </Field>
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="inventory-form" loading={isSubmitting}>
            Add item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
