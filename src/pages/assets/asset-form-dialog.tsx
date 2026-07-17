import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { Asset } from "@/types";
import { useAsync } from "@/hooks/use-async";
import { settingsService } from "@/services";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ASSET_CATEGORY_OPTIONS,
  ASSET_DEPARTMENT_OPTIONS,
  ASSET_LOCATION_OPTIONS,
  ASSET_STATUS_OPTIONS,
} from "@/config/constants";

const assetSchema = z.object({
  name: z.string().min(2, "Name is required"),
  assetTag: z.string().min(2, "Asset tag is required"),
  category: z.string().min(1, "Select a category"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  model: z.string().min(1, "Model is required"),
  serialNumber: z.string().min(2, "Serial number is required"),
  status: z.string().min(1, "Select a status"),
  condition: z.string().min(1, "Select a condition"),
  location: z.string().min(1, "Select a location"),
  department: z.string().min(1, "Select a department"),
  supplier: z.string().min(1, "Supplier is required"),
  purchaseDate: z.string().optional(),
  warranty: z.string().optional(),
  notes: z.string().optional(),
});

export type AssetFormValues = z.infer<typeof assetSchema>;

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset | null;
  onSubmit: (values: AssetFormValues) => Promise<void> | void;
}

const CONDITIONS = ["new", "good", "fair", "poor"];

function Field({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function AssetFormDialog({
  open,
  onOpenChange,
  asset,
  onSubmit,
}: AssetFormDialogProps) {
  const isEdit = Boolean(asset);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      assetTag: "",
      category: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      status: "available",
      condition: "new",
      location: "",
      department: "",
      supplier: "",
      purchaseDate: "",
      warranty: "",
      notes: "",
    },
  });

  const { data: settings } = useAsync(() => settingsService.getAll(), []);
  const categoryOptions = settings?.category_options?.length ? settings?.category_options : ASSET_CATEGORY_OPTIONS;
  const locationOptions = settings?.location_options?.length ? settings?.location_options : ASSET_LOCATION_OPTIONS;
  const departmentOptions = settings?.department_options?.length ? settings?.department_options : ASSET_DEPARTMENT_OPTIONS;
  const manufacturerOptions = settings?.manufacturer_options || [];
  const modelOptions = settings?.model_options || [];

  useEffect(() => {
    if (open) {
      if (asset) {
        reset({
          name: asset.name,
          assetTag: asset.assetTag,
          category: asset.category,
          manufacturer: asset.manufacturer,
          model: asset.model,
          serialNumber: asset.serialNumber,
          status: asset.status,
          condition: asset.condition,
          location: asset.location,
          department: asset.department,
          supplier: asset.supplier,
          purchaseDate: asset.purchaseDate ?? "",
          warranty: asset.warranty ?? "",
          notes: asset.notes ?? "",
        });
      } else {
        // Generate new asset tag
        const newTag = `AST-${Math.floor(Date.now() / 1000).toString().slice(-6)}`;
        reset({
          name: "",
          assetTag: newTag,
          category: "",
          manufacturer: "",
          model: "",
          serialNumber: "",
          status: "available",
          condition: "new",
          location: "",
          department: "",
          supplier: "",
          purchaseDate: "",
          warranty: "",
          notes: "",
        });
      }
    }
  }, [open, asset, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b p-6">
          <DialogTitle>{isEdit ? "Edit Asset" : "Add New Asset"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this hardware asset."
              : "Register a new hardware asset into the inventory."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60svh]">
          <form id="asset-form" onSubmit={submit} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Asset name" required error={errors.name?.message}>
                <Input placeholder="e.g. MacBook Pro 14&quot;" {...register("name")} />
              </Field>
            </div>
            <Field label="Asset tag" required error={errors.assetTag?.message}>
              <Input placeholder="LT-1234" {...register("assetTag")} readOnly className="bg-muted text-muted-foreground" />
            </Field>
            <Field label="Serial number" required error={errors.serialNumber?.message}>
              <Input placeholder="SN000000" {...register("serialNumber")} />
            </Field>

            <Field label="Category" required error={errors.category?.message}>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((c: string) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Status" required error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Select value={field.value} onValueChange={field.onChange} disabled={asset?.status === "in-use"}>
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s.replace("-", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {asset?.status === "in-use" && (
                      <p className="text-[11px] text-muted-foreground">
                        Status locked. Use the Issue/Return page to return it first.
                      </p>
                    )}
                  </div>
                )}
              />
            </Field>

            <Field label="Manufacturer" required error={errors.manufacturer?.message}>
              <Controller
                control={control}
                name="manufacturer"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturerOptions.map((m: string) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Model" required error={errors.model?.message}>
              <Controller
                control={control}
                name="model"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map((m: string) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Condition" required error={errors.condition?.message}>
              <Controller
                control={control}
                name="condition"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="capitalize">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Location" required error={errors.location?.message}>
              <Controller
                control={control}
                name="location"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.map((l: string) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Department" required error={errors.department?.message}>
              <Controller
                control={control}
                name="department"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((d: string) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Supplier" required error={errors.supplier?.message}>
                <Input placeholder="e.g. CDW or Local Vendor" {...register("supplier")} />
              </Field>
            </div>
            <Field label="Purchase Date" error={errors.purchaseDate?.message}>
              <Input type="date" {...register("purchaseDate")} />
            </Field>
            <Field label="Warranty Expiration" error={errors.warranty?.message}>
              <Input type="date" {...register("warranty")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes & Extras (e.g., Charger S/N)" error={errors.notes?.message}>
                <Textarea rows={3} placeholder="Optional notes..." {...register("notes")} />
              </Field>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="border-t p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="asset-form" loading={isSubmitting}>
            {isEdit ? "Save changes" : "Create asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
