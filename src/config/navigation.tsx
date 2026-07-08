import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Camera,
  CircleHelp,
  LayoutDashboard,
  Bell,
  Laptop,
  PackageSearch,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
  ArrowLeftRight,
  BarChart3,
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
        description: "Fleet health, KPIs and activity at a glance",
      },
      {
        title: "Reports & Analytics",
        href: "/reports",
        icon: BarChart3,
        description: "Deep-dive analytics and exportable reports",
      },
    ],
  },
  {
    label: "Asset Lifecycle",
    items: [
      {
        title: "Asset Management",
        href: "/assets",
        icon: Laptop,
        description: "Track, assign and audit every hardware asset",
      },
      {
        title: "Inventory",
        href: "/inventory",
        icon: Boxes,
        description: "Consumables, stock levels and reorders",
      },
      {
        title: "Issue & Returns",
        href: "/issues",
        icon: ArrowLeftRight,
        description: "Device check-out and check-in workflow",
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
        icon: ShieldCheck,
        description: "Repair tickets, SLAs and technician queue",
      },
      {
        title: "Spare Parts",
        href: "/spare-parts",
        icon: PackageSearch,
        description: "Component stock for repairs and swaps",
      },
      {
        title: "CCTV",
        href: "/cctv",
        icon: Camera,
        description: "Camera fleet status and storage monitoring",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: Users,
        description: "Team members, roles and access",
      },
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
        description: "System alerts and activity feed",
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Organization and application preferences",
      },
      {
        title: "Profile",
        href: "/profile",
        icon: UserCog,
        description: "Your account and personal preferences",
      },
      {
        title: "Help Center",
        href: "/help",
        icon: CircleHelp,
        description: "Guides, FAQs and support",
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
