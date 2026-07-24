import { Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Breadcrumbs } from "./breadcrumbs";
import { NotificationsPopover } from "./notifications-popover";
import { UserMenu } from "./user-menu";

interface TopbarProps {
  onOpenMobileSidebar: () => void;
  onOpenCommand: () => void;
}

export function Topbar({ onOpenMobileSidebar, onOpenCommand }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl backdrop-saturate-150 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileSidebar}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <div className="hidden lg:block">
        <Breadcrumbs />
      </div>

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Search trigger - Desktop */}
        <button
          onClick={onOpenCommand}
          className="hidden items-center gap-2.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted/60 hover:shadow-sm sm:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="pr-8 text-[13px]">Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/80 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground/80">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* Search trigger - Mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={onOpenCommand}
          aria-label="Search"
        >
          <Search className="h-[1.15rem] w-[1.15rem]" />
        </Button>

        {/* Notifications */}
        <NotificationsPopover />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div className="mx-1 hidden h-6 w-px bg-border/60 sm:block" />

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}
