import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-primary to-chart-3 shadow-glow-sm">
        <svg
          viewBox="0 0 32 32"
          className="h-[18px] w-[18px] text-white"
          aria-hidden="true"
        >
          <path
            d="M9 21.5 15.2 8.5c.32-.67 1.28-.67 1.6 0L23 21.5c.3.62-.16 1.34-.86 1.34h-3.02c-.36 0-.69-.2-.85-.53l-1.4-2.86a.95.95 0 0 0-1.7 0l-1.4 2.86c-.16.33-.49.53-.85.53H9.86c-.7 0-1.16-.72-.86-1.34Z"
            fill="currentColor"
          />
        </svg>
      </div>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-bold tracking-tight text-white">
            AssetFlow
          </span>
          <span className="text-[10px] font-medium text-sidebar-foreground/50">
            Enterprise
          </span>
        </div>
      )}
    </div>
  );
}
