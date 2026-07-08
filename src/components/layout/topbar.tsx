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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/70 bg-background/70 px-4 backdrop-blur-xl backdrop-saturate-150 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileSidebar}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden lg:block">
        <Breadcrumbs />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onOpenCommand}
          className="hidden items-center gap-2 rounded-lg border border-input bg-background/50 px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 sm:flex"
        >
          <Search className="h-4 w-4" />
          <span className="pr-6">Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={onOpenCommand}
          aria-label="Search"
        >
          <Search className="h-[1.15rem] w-[1.15rem]" />
        </Button>

        <NotificationsPopover />
        <ThemeToggle />
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
        <UserMenu />
      </div>
    </header>
  );
}
