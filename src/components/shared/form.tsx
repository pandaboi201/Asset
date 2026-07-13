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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
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

/** React Hook Form-bound Combobox (searchable select). */
export function FormCombobox<T extends FieldValues>({
  control,
  name,
  placeholder,
  options,
}: {
  control: Control<T>;
  name: Path<T>;
  placeholder?: string;
  options: SelectOption[];
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}
            >
              {field.value
                ? options.find((option) => option.value === field.value)?.label
                : placeholder || "Select..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      value={option.label}
                      key={option.value}
                      onSelect={() => {
                        field.onChange(option.value);
                        // Hack to close popover because Popover is uncontrolled here by default,
                        // but it should auto-close. If not, it's fine.
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          option.value === field.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
