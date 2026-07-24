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
import type { AppLocation } from "@/services";

const locationSchema = z.object({
  name: z.string().min(2, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  type: z.enum(["office", "warehouse", "datacenter", "remote"]),
  capacity: z.coerce.number().min(0, "Must be 0 or more"),
  manager: z.string().min(2, "Manager is required"),
  status: z.enum(["active", "inactive"]),
});

export type LocationFormValues = z.infer<typeof locationSchema>;

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: AppLocation | null;
  onSubmit: (values: LocationFormValues) => Promise<void> | void;
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

export function LocationFormDialog({
  open,
  onOpenChange,
  location,
  onSubmit,
}: LocationFormDialogProps) {
  const isEdit = Boolean(location);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      country: "",
      type: "office",
      capacity: 0,
      manager: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        location
          ? {
              name: location.name,
              address: location.address,
              city: location.city,
              country: location.country,
              type: location.type,
              capacity: location.capacity,
              manager: location.manager,
              status: location.status,
            }
          : undefined,
      );
    }
  }, [open, location, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-5">
          <DialogTitle>{isEdit ? "Edit Location" : "Add Location"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this location's details."
              : "Register a new office, warehouse, data center or remote zone."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="location-form"
          onSubmit={submit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Location name" error={errors.name?.message}>
                <Input placeholder="HQ - San Francisco" {...register("name")} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Address" error={errors.address?.message}>
                <Input placeholder="123 Market St" {...register("address")} />
              </Field>
            </div>
            <Field label="City" error={errors.city?.message}>
              <Input placeholder="San Francisco" {...register("city")} />
            </Field>
            <Field label="Country" error={errors.country?.message}>
              <Input placeholder="USA" {...register("country")} />
            </Field>
            <Field label="Type" error={errors.type?.message}>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="datacenter">Data Center</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Capacity" error={errors.capacity?.message}>
              <Input type="number" min={0} {...register("capacity")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Manager" error={errors.manager?.message}>
                <Input placeholder="Jane Doe" {...register("manager")} />
              </Field>
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="location-form" loading={isSubmitting}>
            {isEdit ? "Save changes" : "Create location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
