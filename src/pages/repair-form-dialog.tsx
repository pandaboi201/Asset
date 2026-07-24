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

const repairSchema = z.object({
  assetTag: z.string().min(1, "Asset tag is required"),
  assetName: z.string().min(1, "Asset name is required"),
  issueSummary: z.string().min(2, "Describe the issue"),
  reportedByName: z.string().min(2, "Reporter name is required"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  slaHours: z.coerce.number().min(1, "Must be at least 1 hour"),
});

export type RepairFormValues = z.infer<typeof repairSchema>;

interface RepairFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RepairFormValues) => Promise<void> | void;
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

export function RepairFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: RepairFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RepairFormValues>({
    resolver: zodResolver(repairSchema),
    defaultValues: {
      assetTag: "",
      assetName: "",
      issueSummary: "",
      reportedByName: "",
      priority: "medium",
      slaHours: 48,
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
          <DialogTitle>New Repair Ticket</DialogTitle>
          <DialogDescription>
            Report a hardware issue and open a repair ticket.
          </DialogDescription>
        </DialogHeader>

        <form
          id="repair-form"
          onSubmit={submit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <Field label="Asset tag" error={errors.assetTag?.message}>
              <Input placeholder="LT-1001" {...register("assetTag")} />
            </Field>
            <Field label="Asset name" error={errors.assetName?.message}>
              <Input placeholder="Apple MacBook Pro 14&quot;" {...register("assetName")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Issue summary" error={errors.issueSummary?.message}>
                <Input placeholder="Screen flickering intermittently" {...register("issueSummary")} />
              </Field>
            </div>
            <Field label="Reported by" error={errors.reportedByName?.message}>
              <Input placeholder="Priya Patel" {...register("reportedByName")} />
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
            <div className="sm:col-span-2">
              <Field label="SLA (hours)" error={errors.slaHours?.message}>
                <Input type="number" min={1} {...register("slaHours")} />
              </Field>
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="repair-form" loading={isSubmitting}>
            Create ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
