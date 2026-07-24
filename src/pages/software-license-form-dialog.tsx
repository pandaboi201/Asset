import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SoftwareLicense } from "@/services";

const licenseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  vendor: z.string().min(1, "Vendor is required"),
  licenseType: z.enum(["perpetual", "subscription", "volume", "oem"]),
  totalSeats: z.coerce.number().min(1, "Must be at least 1"),
  category: z.string().min(1, "Category is required"),
  costPerYear: z.coerce.number().min(0, "Must be 0 or more"),
  expiryDate: z.string().optional(),
});

export type LicenseFormValues = z.infer<typeof licenseSchema>;

interface LicenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license?: SoftwareLicense | null;
  onSubmit: (values: LicenseFormValues) => Promise<void> | void;
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

export function LicenseFormDialog({
  open,
  onOpenChange,
  license,
  onSubmit,
}: LicenseFormDialogProps) {
  const isEdit = Boolean(license);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      name: "",
      vendor: "",
      licenseType: "subscription",
      totalSeats: 1,
      category: "",
      costPerYear: 0,
      expiryDate: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        license
          ? {
              name: license.name,
              vendor: license.vendor,
              licenseType: license.licenseType,
              totalSeats: license.totalSeats,
              category: license.category,
              costPerYear: 0,
              expiryDate: license.expiryDate === "—" ? "" : license.expiryDate,
            }
          : undefined,
      );
    }
  }, [open, license, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-5">
          <DialogTitle>{isEdit ? "Edit License" : "Add Software License"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this license's details."
              : "Register a new software license entitlement."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="license-form"
          onSubmit={submit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Software name" error={errors.name?.message}>
                <Input placeholder="Microsoft 365 E3" {...register("name")} />
              </Field>
            </div>
            <Field label="Vendor" error={errors.vendor?.message}>
              <Input placeholder="Microsoft" {...register("vendor")} />
            </Field>
            <Field label="Category" error={errors.category?.message}>
              <Input placeholder="Productivity" {...register("category")} />
            </Field>
            <Field label="License type" error={errors.licenseType?.message}>
              <Controller
                control={control}
                name="licenseType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="perpetual">Perpetual</SelectItem>
                      <SelectItem value="volume">Volume</SelectItem>
                      <SelectItem value="oem">OEM</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Total seats" error={errors.totalSeats?.message}>
              <Input type="number" min={1} {...register("totalSeats")} />
            </Field>
            <Field label="Cost per year (USD)" error={errors.costPerYear?.message}>
              <Input type="number" min={0} step="0.01" {...register("costPerYear")} />
            </Field>
            <Field label="Expiry date (optional)" error={errors.expiryDate?.message}>
              <Input type="date" {...register("expiryDate")} />
            </Field>
          </div>
        </form>

        <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="license-form" loading={isSubmitting}>
            {isEdit ? "Save changes" : "Create license"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
