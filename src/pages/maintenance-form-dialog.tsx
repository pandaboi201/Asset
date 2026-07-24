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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const maintenanceSchema = z.object({
  title: z.string().min(2, "Title is required"),
  assetTag: z.string().min(1, "Asset tag is required"),
  assetName: z.string().min(1, "Asset name is required"),
  type: z.enum(["preventive", "corrective", "inspection"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignedToName: z.string().min(2, "Technician is required"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  vendor: z.string().optional(),
  description: z.string().min(1, "Description is required"),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

interface MaintenanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MaintenanceFormValues) => Promise<void> | void;
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

export function MaintenanceFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: MaintenanceFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      title: "",
      assetTag: "",
      assetName: "",
      type: "preventive",
      priority: "medium",
      assignedToName: "",
      scheduledDate: "",
      vendor: "",
      description: "",
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
          <DialogTitle>Schedule Maintenance Task</DialogTitle>
          <DialogDescription>
            Plan a preventive, corrective or inspection task for a device.
          </DialogDescription>
        </DialogHeader>

        <form
          id="maintenance-form"
          onSubmit={submit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Task title" error={errors.title?.message}>
                <Input placeholder="Quarterly hardware inspection" {...register("title")} />
              </Field>
            </div>
            <Field label="Asset tag" error={errors.assetTag?.message}>
              <Input placeholder="LT-1001" {...register("assetTag")} />
            </Field>
            <Field label="Asset name" error={errors.assetName?.message}>
              <Input placeholder="Apple MacBook Pro 14&quot;" {...register("assetName")} />
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
                      <SelectItem value="preventive">Preventive</SelectItem>
                      <SelectItem value="corrective">Corrective</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Priority" error={errors.priority?.message}>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Technician" error={errors.assignedToName?.message}>
              <Input placeholder="Marcus Williams" {...register("assignedToName")} />
            </Field>
            <Field label="Scheduled date" error={errors.scheduledDate?.message}>
              <Input type="date" {...register("scheduledDate")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Vendor (optional)" error={errors.vendor?.message}>
                <Input placeholder="OnSite Tech" {...register("vendor")} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Description" error={errors.description?.message}>
                <Textarea rows={3} placeholder="Describe the maintenance work..." {...register("description")} />
              </Field>
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="maintenance-form" loading={isSubmitting}>
            Schedule task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
