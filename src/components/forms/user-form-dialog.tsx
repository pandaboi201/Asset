import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { User, UserRole } from "@/types";
import { userService } from "@/services";
import { DEPARTMENT_OPTIONS, LOCATION_OPTIONS } from "@/config/constants";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { FormDialogShell, FormField, FormSelect } from "@/components/shared/form";

const ROLES = ["admin", "manager", "technician", "viewer"];

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  role: z.string().min(1, "Select a role"),
  department: z.string().min(1, "Select a department"),
  location: z.string().min(1, "Select a location"),
  phone: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function UserFormDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      role: "viewer",
      department: "",
      location: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    const now = new Date().toISOString();
    await userService.create({
      id: `usr-${Date.now()}`,
      name: values.name,
      email: values.email,
      avatarUrl: undefined,
      role: values.role as UserRole,
      department: values.department,
      jobTitle: "-",
      phone: values.phone?.trim() || undefined,
      location: values.location,
      status: "active",
      lastActiveAt: now,
      createdAt: now,
    } as User);
    toast.success(`User added: ${values.name}`);
    onCreated?.();
    onOpenChange(false);
  });

  return (
    <FormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Add User"
      description="Add a team member to the system."
      formId="user-form"
      onSubmit={submit}
      submitLabel="Add user"
      submitting={isSubmitting}
    >
      <FormField label="Full name" required error={errors.name?.message}>
        <Input placeholder="Jane Doe" {...register("name")} />
      </FormField>
      <FormField label="Email" required error={errors.email?.message}>
        <Input type="email" placeholder="jane.doe@acme.io" {...register("email")} />
      </FormField>
      <FormField label="Role" required error={errors.role?.message}>
        <FormSelect
          control={control}
          name="role"
          placeholder="Select role"
          capitalize
          options={ROLES.map((r) => ({ label: r, value: r }))}
        />
      </FormField>
      <FormField label="Department" required error={errors.department?.message}>
        <FormSelect
          control={control}
          name="department"
          placeholder="Select department"
          options={DEPARTMENT_OPTIONS.map((d) => ({ label: d, value: d }))}
        />
      </FormField>
      <FormField label="Location" required error={errors.location?.message}>
        <FormSelect
          control={control}
          name="location"
          placeholder="Select location"
          options={LOCATION_OPTIONS.map((l) => ({ label: l, value: l }))}
        />
      </FormField>
      <FormField label="Phone" full error={errors.phone?.message}>
        <Input placeholder="+1 (415) 555-0100" {...register("phone")} />
      </FormField>
    </FormDialogShell>
  );
}
