import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/pages/dashboard";
import { ReportsPage } from "@/pages/reports";
import { AssetsPage } from "@/pages/assets";
import { InventoryPage } from "@/pages/inventory";
import { IssuesPage } from "@/pages/issues";
import { MaintenancePage } from "@/pages/maintenance";
import { RepairsPage } from "@/pages/repairs";
import { SparePartsPage } from "@/pages/spare-parts";
import { CctvPage } from "@/pages/cctv";
import { UsersPage } from "@/pages/users";
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
      { index: true, element: <DashboardPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "assets", element: <AssetsPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "issues", element: <IssuesPage /> },
      { path: "maintenance", element: <MaintenancePage /> },
      { path: "repairs", element: <RepairsPage /> },
      { path: "spare-parts", element: <SparePartsPage /> },
      { path: "cctv", element: <CctvPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "help", element: <HelpPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
