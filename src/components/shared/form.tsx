import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Labelled form control with optional error text. */
export function FormField({
  label,
  error,
  required,
  full,
  className,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  full?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2", className)}>
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export interface SelectOption {
  label: string;
  value: string;
}

/** React Hook Form-bound Select. */
export function FormSelect<T extends FieldValues>({
  control,
  name,
  placeholder,
  options,
  capitalize,
}: {
  control: Control<T>;
  name: Path<T>;
  placeholder?: string;
  options: SelectOption[];
  capitalize?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={(field.value as string) || ""} onValueChange={field.onChange}>
          <SelectTrigger className={cn(capitalize && "capitalize")}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem
                key={o.value}
                value={o.value}
                className={capitalize ? "capitalize" : undefined}
              >
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}

/** Consistent dialog chrome for create/edit forms: header, scrollable 2-col
 *  grid body and a sticky footer wired to a `<form id>` via the submit button. */
export function FormDialogShell({
  open,
  onOpenChange,
  title,
  description,
  formId,
  onSubmit,
  submitLabel = "Save",
  submitting,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  formId: string;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  submitLabel?: string;
  submitting?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b p-6">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <ScrollArea className="max-h-[60svh]">
          <form
            id={formId}
            onSubmit={onSubmit}
            className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2"
          >
            {children}
          </form>
        </ScrollArea>

        <DialogFooter className="border-t p-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
