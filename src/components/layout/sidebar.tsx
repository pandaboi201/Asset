import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-premium lg:flex",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-0" : "px-5",
        )}
      >
        <Logo showWordmark={!collapsed} />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <SidebarNav collapsed={collapsed} />
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="mb-3 rounded-xl bg-gradient-to-br from-primary/15 via-chart-3/10 to-transparent p-3.5 ring-1 ring-white/5">
            <p className="text-xs font-semibold text-white/90">System Status</p>
            <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/60">
              All services operational
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <span className="text-[10px] font-medium text-success">Healthy</span>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={onToggle}
          className={cn(
            "w-full text-sidebar-foreground/60 hover:bg-white/5 hover:text-white transition-colors",
            !collapsed && "justify-start gap-2",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
