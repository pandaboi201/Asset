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
import { CCTV_ZONE_OPTIONS } from "@/data/options";

const cameraSchema = z.object({
  name: z.string().min(2, "Name is required"),
  location: z.string().min(1, "Location is required"),
  zone: z.string().min(1, "Zone is required"),
  ipAddress: z
    .string()
    .regex(/^\d{1,3}(\.\d{1,3}){3}$/, "Enter a valid IPv4 address"),
  model: z.string().min(1, "Model is required"),
  resolution: z.string().min(1, "Resolution is required"),
});

export type CameraFormValues = z.infer<typeof cameraSchema>;

interface CameraFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CameraFormValues) => Promise<void> | void;
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

export function CameraFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: CameraFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CameraFormValues>({
    resolver: zodResolver(cameraSchema),
    defaultValues: {
      name: "",
      location: "",
      zone: "",
      ipAddress: "",
      model: "",
      resolution: "4K UHD",
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
          <DialogTitle>Add Camera</DialogTitle>
          <DialogDescription>
            Register a new camera into the CCTV fleet inventory.
          </DialogDescription>
        </DialogHeader>

        <form
          id="camera-form"
          onSubmit={submit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Camera name" error={errors.name?.message}>
                <Input placeholder="CAM-25" {...register("name")} />
              </Field>
            </div>
            <Field label="Location" error={errors.location?.message}>
              <Input placeholder="Main Entrance North" {...register("location")} />
            </Field>
            <Field label="Zone" error={errors.zone?.message}>
              <Controller
                control={control}
                name="zone"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {CCTV_ZONE_OPTIONS.map((z) => (
                        <SelectItem key={z} value={z}>
                          {z}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="IP address" error={errors.ipAddress?.message}>
              <Input placeholder="10.20.1.55" {...register("ipAddress")} />
            </Field>
            <Field label="Model" error={errors.model?.message}>
              <Input placeholder="Axis P3268-LV" {...register("model")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Resolution" error={errors.resolution?.message}>
                <Controller
                  control={control}
                  name="resolution"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4K UHD">4K UHD</SelectItem>
                        <SelectItem value="12MP">12MP</SelectItem>
                        <SelectItem value="8MP">8MP</SelectItem>
                        <SelectItem value="4MP">4MP</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="camera-form" loading={isSubmitting}>
            Add camera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
