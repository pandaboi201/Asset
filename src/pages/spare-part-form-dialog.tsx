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

const sparePartSchema = z.object({
  partNumber: z.string().min(2, "Part number is required"),
  name: z.string().min(2, "Name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.coerce.number().min(0, "Must be 0 or more"),
  reorderLevel: z.coerce.number().min(0, "Must be 0 or more"),
  supplier: z.string().min(1, "Supplier is required"),
  location: z.string().min(1, "Bin/location is required"),
  compatibleWith: z.string().optional(),
});

export type SparePartFormValues = z.infer<typeof sparePartSchema>;

interface SparePartFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SparePartFormValues) => Promise<void> | void;
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

export function SparePartFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: SparePartFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SparePartFormValues>({
    resolver: zodResolver(sparePartSchema),
    defaultValues: {
      partNumber: "",
      name: "",
      category: "",
      quantity: 0,
      reorderLevel: 8,
      supplier: "",
      location: "",
      compatibleWith: "",
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
          <DialogTitle>Add Spare Part</DialogTitle>
          <DialogDescription>
            Register a new component into the spare parts inventory.
          </DialogDescription>
        </DialogHeader>

        <form
          id="spare-part-form"
          onSubmit={submit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Part name" error={errors.name?.message}>
                <Input placeholder="Laptop Battery (Li-Ion)" {...register("name")} />
              </Field>
            </div>
            <Field label="Part number" error={errors.partNumber?.message}>
              <Input placeholder="PN-9200" {...register("partNumber")} />
            </Field>
            <Field label="Category" error={errors.category?.message}>
              <Input placeholder="Power" {...register("category")} />
            </Field>
            <Field label="Quantity" error={errors.quantity?.message}>
              <Input type="number" min={0} {...register("quantity")} />
            </Field>
            <Field label="Reorder level" error={errors.reorderLevel?.message}>
              <Input type="number" min={0} {...register("reorderLevel")} />
            </Field>
            <Field label="Supplier" error={errors.supplier?.message}>
              <Input placeholder="Parts Direct" {...register("supplier")} />
            </Field>
            <Field label="Bin / location" error={errors.location?.message}>
              <Input placeholder="Bin A-1" {...register("location")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Compatible models (comma-separated)" error={errors.compatibleWith?.message}>
                <Input placeholder='MacBook Pro 14", Latitude 7440' {...register("compatibleWith")} />
              </Field>
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="spare-part-form" loading={isSubmitting}>
            Add part
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
