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
        {/* Ambient background accents */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute -right-40 top-1/3 h-[380px] w-[380px] rounded-full bg-info/10 blur-[120px]" />
        </div>

        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
        <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

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

        <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
      </div>
    </TooltipProvider>
  );
}
