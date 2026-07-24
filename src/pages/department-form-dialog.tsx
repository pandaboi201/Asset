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
import type { Department } from "@/services";

const departmentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(1, "Code is required"),
  head: z.string().min(2, "Department head is required"),
  headCount: z.coerce.number().min(0, "Must be 0 or more"),
  budget: z.string().min(1, "Budget is required"),
  location: z.string().min(1, "Location is required"),
  status: z.enum(["active", "inactive"]),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  onSubmit: (values: DepartmentFormValues) => Promise<void> | void;
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

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  onSubmit,
}: DepartmentFormDialogProps) {
  const isEdit = Boolean(department);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      code: "",
      head: "",
      headCount: 0,
      budget: "",
      location: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        department
          ? {
              name: department.name,
              code: department.code,
              head: department.head,
              headCount: department.headCount,
              budget: department.budget,
              location: department.location,
              status: department.status,
            }
          : undefined,
      );
    }
  }, [open, department, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-5">
          <DialogTitle>{isEdit ? "Edit Department" : "Add Department"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this department's details."
              : "Create a new organizational department."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="department-form"
          onSubmit={submit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Department name" error={errors.name?.message}>
                <Input placeholder="Engineering" {...register("name")} />
              </Field>
            </div>
            <Field label="Code" error={errors.code?.message}>
              <Input placeholder="ENG" {...register("code")} />
            </Field>
            <Field label="Employees" error={errors.headCount?.message}>
              <Input type="number" min={0} {...register("headCount")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Department head" error={errors.head?.message}>
                <Input placeholder="Jane Doe" {...register("head")} />
              </Field>
            </div>
            <Field label="Budget" error={errors.budget?.message}>
              <Input placeholder="$2.4M" {...register("budget")} />
            </Field>
            <Field label="Location" error={errors.location?.message}>
              <Input placeholder="Floor 3" {...register("location")} />
            </Field>
          </div>
        </form>

        <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="department-form" loading={isSubmitting}>
            {isEdit ? "Save changes" : "Create department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
