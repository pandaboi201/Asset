import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

import { navGroups } from "@/config/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-5 px-3 py-3">
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              {group.label}
            </p>
          )}
          {collapsed && (
            <div className="mx-auto mb-1 h-px w-6 bg-sidebar-border/60" />
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            const link = (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/"}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                    "text-sidebar-foreground/70 hover:bg-white/[0.06] hover:text-white",
                    isActive &&
                      "bg-sidebar-accent/12 text-white hover:bg-sidebar-accent/16",
                    collapsed && "justify-center px-0 py-2.5",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active-indicator"
                        className="absolute left-0 inset-y-1.5 w-[3px] rounded-r-full bg-sidebar-accent"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 35,
                        }}
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                        isActive
                          ? "text-sidebar-accent"
                          : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80",
                      )}
                    />
                    {!collapsed && (
                      <span className="truncate">{item.title}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-accent/20 px-1.5 text-[10px] font-bold text-sidebar-accent">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );

            return collapsed ? (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="font-medium"
                  sideOffset={8}
                >
                  {item.title}
                </TooltipContent>
              </Tooltip>
            ) : (
              link
            );
          })}
        </div>
      ))}
    </nav>
  );
}
