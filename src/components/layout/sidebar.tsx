import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

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
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out lg:flex",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Logo showWordmark={!collapsed} />
      </div>

      <ScrollArea className="flex-1">
        <SidebarNav collapsed={collapsed} />
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="mb-3 rounded-xl bg-gradient-to-br from-sidebar-accent/20 to-info/10 p-3">
            <p className="text-xs font-semibold text-white">System healthy</p>
            <p className="mt-0.5 text-[11px] text-sidebar-foreground/70">
              All 24 cameras & 3 servers online.
            </p>
          </div>
        ) : null}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={onToggle}
          className={cn(
            "w-full text-sidebar-foreground/70 hover:bg-white/5 hover:text-white",
            !collapsed && "justify-start gap-2",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px]" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
