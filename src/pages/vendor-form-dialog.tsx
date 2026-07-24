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
import type { Vendor } from "@/services";

const vendorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  category: z.string().min(1, "Category is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(3, "Phone is required"),
  status: z.enum(["active", "inactive", "preferred"]),
  contractEnd: z.string().optional(),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;

interface VendorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor | null;
  onSubmit: (values: VendorFormValues) => Promise<void> | void;
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

export function VendorFormDialog({
  open,
  onOpenChange,
  vendor,
  onSubmit,
}: VendorFormDialogProps) {
  const isEdit = Boolean(vendor);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      category: "",
      contactPerson: "",
      email: "",
      phone: "",
      status: "active",
      contractEnd: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        vendor
          ? {
              name: vendor.name,
              category: vendor.category,
              contactPerson: vendor.contactPerson,
              email: vendor.email,
              phone: vendor.phone,
              status: vendor.status,
              contractEnd: vendor.contractEnd ?? "",
            }
          : undefined,
      );
    }
  }, [open, vendor, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-5">
          <DialogTitle>{isEdit ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this vendor's details."
              : "Register a new supplier or vendor relationship."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="vendor-form"
          onSubmit={submit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Vendor name" error={errors.name?.message}>
                <Input placeholder="Dell Technologies" {...register("name")} />
              </Field>
            </div>
            <Field label="Category" error={errors.category?.message}>
              <Input placeholder="Hardware" {...register("category")} />
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="preferred">Preferred</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Contact person" error={errors.contactPerson?.message}>
                <Input placeholder="Jane Doe" {...register("contactPerson")} />
              </Field>
            </div>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" placeholder="sales@vendor.com" {...register("email")} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input placeholder="+1-800-000-0000" {...register("phone")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Contract end date (optional)" error={errors.contractEnd?.message}>
                <Input type="date" {...register("contractEnd")} />
              </Field>
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="vendor-form" loading={isSubmitting}>
            {isEdit ? "Save changes" : "Create vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
