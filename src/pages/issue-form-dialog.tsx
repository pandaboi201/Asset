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

const issueSchema = z.object({
  assetTag: z.string().min(1, "Asset tag is required"),
  assetName: z.string().min(1, "Asset name is required"),
  issuedToName: z.string().min(2, "Recipient name is required"),
  issuedToDepartment: z.string().min(1, "Department is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

export type IssueFormValues = z.infer<typeof issueSchema>;

interface IssueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: IssueFormValues) => Promise<void> | void;
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

export function IssueFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: IssueFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      assetTag: "",
      assetName: "",
      issuedToName: "",
      issuedToDepartment: "",
      dueDate: "",
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
          <DialogTitle>Issue Device</DialogTitle>
          <DialogDescription>
            Check out a device to a team member.
          </DialogDescription>
        </DialogHeader>

        <form
          id="issue-form"
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
              <Field label="Issued to" error={errors.issuedToName?.message}>
                <Input placeholder="Priya Patel" {...register("issuedToName")} />
              </Field>
            </div>
            <Field label="Department" error={errors.issuedToDepartment?.message}>
              <Input placeholder="Engineering" {...register("issuedToDepartment")} />
            </Field>
            <Field label="Due date" error={errors.dueDate?.message}>
              <Input type="date" {...register("dueDate")} />
            </Field>
          </div>
        </form>

        <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="issue-form" loading={isSubmitting}>
            Issue device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
