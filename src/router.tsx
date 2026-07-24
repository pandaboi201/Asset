import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/pages/dashboard";
import { ReportsPage } from "@/pages/reports";
import { AssetsPage } from "@/pages/assets";
import { AssetDetailPage } from "@/pages/assets/asset-detail";
import { InventoryPage } from "@/pages/inventory";
import { IssuesPage } from "@/pages/issues";
import { MaintenancePage } from "@/pages/maintenance";
import { RepairsPage } from "@/pages/repairs";
import { SparePartsPage } from "@/pages/spare-parts";
import { CctvPage } from "@/pages/cctv";
import { UsersPage } from "@/pages/users";
import { DepartmentsPage } from "@/pages/departments";
import { LocationsPage } from "@/pages/locations";
import { VendorsPage } from "@/pages/vendors";
import { SoftwareLicensesPage } from "@/pages/software-licenses";
import { AuditLogsPage } from "@/pages/audit-logs";
import { ImportExportPage } from "@/pages/import-export";
import { NotificationsPage } from "@/pages/notifications";
import { SettingsPage } from "@/pages/settings";
import { ProfilePage } from "@/pages/profile";
import { HelpPage } from "@/pages/help";
import { NotFoundPage } from "@/pages/not-found";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      // Overview
      { index: true, element: <DashboardPage /> },
      { path: "reports", element: <ReportsPage /> },

      // Asset Lifecycle
      { path: "assets", element: <AssetsPage /> },
      { path: "assets/:assetId", element: <AssetDetailPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "issues", element: <IssuesPage /> },
      { path: "software-licenses", element: <SoftwareLicensesPage /> },

      // Service & Support
      { path: "maintenance", element: <MaintenancePage /> },
      { path: "repairs", element: <RepairsPage /> },
      { path: "spare-parts", element: <SparePartsPage /> },
      { path: "cctv", element: <CctvPage /> },

      // Organization
      { path: "users", element: <UsersPage /> },
      { path: "departments", element: <DepartmentsPage /> },
      { path: "locations", element: <LocationsPage /> },
      { path: "vendors", element: <VendorsPage /> },

      // Administration
      { path: "audit-logs", element: <AuditLogsPage /> },
      { path: "import-export", element: <ImportExportPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "help", element: <HelpPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
