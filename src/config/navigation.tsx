import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  Camera,
  CircleHelp,
  ClipboardList,
  FileDown,
  Laptop,
  LayoutDashboard,
  MapPin,
  PackageSearch,
  ScrollText,
  Server,
  Settings,
  Shield,
  Store,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        description: "Executive overview of fleet health, KPIs and activity",
      },
      {
        title: "Reports & Analytics",
        href: "/reports",
        icon: BarChart3,
        description: "Deep-dive analytics, charts and exportable reports",
      },
    ],
  },
  {
    label: "Asset Lifecycle",
    items: [
      {
        title: "Assets",
        href: "/assets",
        icon: Laptop,
        description: "Track, assign and audit every hardware asset",
      },
      {
        title: "Inventory",
        href: "/inventory",
        icon: Boxes,
        description: "Consumables, stock levels and reorder management",
      },
      {
        title: "Device Assignment",
        href: "/issues",
        icon: ArrowLeftRight,
        description: "Device check-out and check-in workflow",
      },
      {
        title: "Software Licenses",
        href: "/software-licenses",
        icon: ScrollText,
        description: "Track software entitlements and compliance",
      },
    ],
  },
  {
    label: "Service & Support",
    items: [
      {
        title: "Maintenance",
        href: "/maintenance",
        icon: Wrench,
        description: "Preventive and corrective maintenance schedules",
      },
      {
        title: "Repairs",
        href: "/repairs",
        icon: Shield,
        description: "Repair tickets, SLAs and technician queue",
      },
      {
        title: "Spare Parts",
        href: "/spare-parts",
        icon: PackageSearch,
        description: "Component stock for repairs and swaps",
      },
      {
        title: "CCTV & Surveillance",
        href: "/cctv",
        icon: Camera,
        description: "Camera fleet status and storage monitoring",
      },
    ],
  },
  {
    label: "Organization",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: Users,
        description: "Team members, roles and access control",
      },
      {
        title: "Departments",
        href: "/departments",
        icon: Building2,
        description: "Organizational departments and cost centers",
      },
      {
        title: "Locations",
        href: "/locations",
        icon: MapPin,
        description: "Office locations, floors and zones",
      },
      {
        title: "Vendors",
        href: "/vendors",
        icon: Store,
        description: "Suppliers, contracts and procurement",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Audit Logs",
        href: "/audit-logs",
        icon: ClipboardList,
        description: "Complete audit trail of all system activity",
      },
      {
        title: "Import / Export",
        href: "/import-export",
        icon: FileDown,
        description: "Bulk data operations and CSV management",
      },
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
        description: "System alerts and notification preferences",
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Organization and application preferences",
      },
    ],
  },
];

/** Flat list of all navigable items (for command palette + breadcrumbs). */
export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);

export function findNavItemByPath(pathname: string): NavItem | undefined {
  if (pathname === "/") {
    return allNavItems.find((i) => i.href === "/");
  }
  return allNavItems
    .filter((i) => i.href !== "/")
    .find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
}
