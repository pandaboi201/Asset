import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Sidebar } from "./sidebar";
import { MobileSidebar } from "./mobile-sidebar";
import { Topbar } from "./topbar";
import { CommandMenu } from "./command-menu";
import { PageTransition } from "./page-transition";

export function AppShell() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useLocalStorage(
    "assetflow-sidebar-collapsed",
    false,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative flex min-h-svh w-full bg-background">
        {/* Subtle ambient gradient background */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-[200px] -top-[200px] h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />
          <div className="absolute -right-[150px] top-[30%] h-[400px] w-[400px] rounded-full bg-chart-3/[0.03] blur-[100px]" />
          <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-chart-6/[0.02] blur-[100px]" />
        </div>

        {/* Sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
        <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

        {/* Main content area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            onOpenMobileSidebar={() => setMobileOpen(true)}
            onOpenCommand={() => setCommandOpen(true)}
          />
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1600px]">
              <AnimatePresence mode="wait">
                <PageTransition key={location.pathname}>
                  <Outlet />
                </PageTransition>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Command palette */}
        <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
      </div>
    </TooltipProvider>
  );
}
