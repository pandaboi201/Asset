import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Laptop,
  MoreHorizontal,
  ShieldCheck,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";

import type { Asset, User } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { MiniStat } from "@/components/shared/mini-stat";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailSheet } from "@/components/shared/detail-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAsync } from "@/hooks/use-async";
import { assetService, userService } from "@/services";
import { DEPARTMENT_OPTIONS } from "@/data/users";
import { formatDate, formatRelativeTime, getInitials } from "@/lib/format";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { UserFormDialog } from "@/components/forms/user-form-dialog";

const ROLE_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Technician", value: "technician" },
  { label: "Viewer", value: "viewer" },
];

const ROLE_TONE: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  manager: "bg-info/10 text-info",
  technician: "bg-success/10 text-success",
  viewer: "bg-muted text-muted-foreground",
};

export function UsersPage() {
  const { data, loading, refetch } = useAsync(() => userService.all(), []);
  const assetsQ = useAsync(() => assetService.all(), []);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [detail, setDetail] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const users = data ?? [];

  /** Map of userId -> devices currently assigned to them. */
  const devicesByUser = useMemo(() => {
    const map = new Map<string, Asset[]>();
    for (const asset of assetsQ.data ?? []) {
      const owner = asset.assignedTo?.id;
      if (!owner) continue;
      const list = map.get(owner) ?? [];
      list.push(asset);
      map.set(owner, list);
    }
    return map;
  }, [assetsQ.data]);

  const detailDevices = detail ? (devicesByUser.get(detail.id) ?? []) : [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!q || [u.name, u.email, u.jobTitle].join(" ").toLowerCase().includes(q)) &&
        (!role || u.role === role) &&
        (!department || u.department === department),
    );
  }, [users, search, role, department]);

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      active: users.filter((u) => u.status === "active").length,
      invited: users.filter((u) => u.status === "invited").length,
    }),
    [users],
  );

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs">
                {getInitials(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{row.original.name}</span>
              <span className="text-xs text-muted-foreground">
                {row.original.email}
              </span>
            </div>
          </div>
        ),
        meta: { label: "User" },
      },
      {
        accessorKey: "role",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={cn("capitalize", ROLE_TONE[row.original.role])}
          >
            {row.original.role}
          </Badge>
        ),
        meta: { label: "Role" },
      },
      {
        accessorKey: "department",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
        cell: ({ row }) => (
          <span className="text-sm">{row.original.department}</span>
        ),
        meta: { label: "Department" },
      },
      {
        accessorKey: "jobTitle",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.jobTitle}
          </span>
        ),
        meta: { label: "Title" },
      },
      {
        id: "devices",
        enableSorting: false,
        header: "Devices",
        cell: ({ row }) => {
          const count = devicesByUser.get(row.original.id)?.length ?? 0;
          return (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={count === 0 ? "text-muted-foreground" : "font-medium"}>
                {count}
              </span>
            </span>
          );
        },
        meta: { label: "Devices" },
      },
      {
        accessorKey: "lastActiveAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last active" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(row.original.lastActiveAt)}
          </span>
        ),
        meta: { label: "Last active" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        meta: { label: "Status" },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setDetail(row.original);
                    setOpen(true);
                  }}
                >
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Edit user (demo)")}>
                  Edit user
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.success("Invite resent (demo)")}>
                  Resend invite
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 48,
      },
    ],
    [devicesByUser],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage team members, roles and access permissions."
        icon={<UsersIcon className="h-5 w-5" />}
      >
        <Button onClick={() => setFormOpen(true)}>
          <UserPlus className="h-4 w-4" /> Invite User
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total users" value={stats.total} icon={<UsersIcon className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Administrators" value={stats.admins} tone="info" icon={<ShieldCheck className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Active" value={stats.active} tone="success" icon={<UsersIcon className="h-5 w-5" />} loading={loading} />
        <MiniStat label="Pending invites" value={stats.invited} tone="warning" icon={<UserPlus className="h-5 w-5" />} loading={loading} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          setDetail(row);
          setOpen(true);
        }}
        emptyTitle="No users found"
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search users..."
              className="w-full sm:w-72"
            />
            <FilterSelect value={role} onChange={setRole} options={ROLE_OPTIONS} allLabel="All roles" />
            <FilterSelect value={department} onChange={setDepartment} options={[...DEPARTMENT_OPTIONS]} allLabel="All departments" />
          </>
        }
      />

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} onCreated={refetch} />

      <DetailSheet
        open={open}
        onOpenChange={setOpen}
        headerBadge={detail && <StatusBadge status={detail.status} />}
        title={detail?.name ?? ""}
        subtitle={detail?.jobTitle}
        headerExtra={
          detail && (
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{getInitials(detail.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{detail.email}</p>
                <Badge variant="secondary" className={cn("mt-1 capitalize", ROLE_TONE[detail.role])}>
                  {detail.role}
                </Badge>
              </div>
            </div>
          )
        }
        sections={
          detail
            ? [
                {
                  title: "Details",
                  rows: [
                    { label: "Department", value: detail.department },
                    { label: "Location", value: detail.location },
                    { label: "Phone", value: detail.phone ?? "—" },
                  ],
                },
                {
                  title: "Account",
                  rows: [
                    { label: "Status", value: <StatusBadge status={detail.status} /> },
                    { label: "Last active", value: formatRelativeTime(detail.lastActiveAt) },
                    { label: "Member since", value: formatDate(detail.createdAt) },
                  ],
                },
                {
                  title: `Assigned devices (${detailDevices.length})`,
                  rows: detailDevices.length
                    ? detailDevices.map((d) => ({
                        label: (
                          <Link
                            to={`/assets/${d.id}`}
                            className="font-mono text-xs text-foreground hover:text-primary hover:underline"
                          >
                            {d.assetTag}
                          </Link>
                        ),
                        value: (
                          <span className="flex items-center justify-end gap-2">
                            <span className="max-w-[150px] truncate text-muted-foreground">
                              {d.name}
                            </span>
                            <StatusBadge status={d.status} withDot={false} />
                          </span>
                        ),
                      }))
                    : [
                        {
                          label: "—",
                          value: (
                            <span className="text-muted-foreground">
                              No devices assigned
                            </span>
                          ),
                        },
                      ],
                },
              ]
            : []
        }
        footer={
          detail && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button onClick={() => toast.info("Edit user (demo)")}>Edit user</Button>
            </>
          )
        }
      />
    </div>
  );
}
