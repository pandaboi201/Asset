import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AccentTone } from "@/lib/tones";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  /** Accent color for the icon chip. Defaults to primary blue. */
  tone?: AccentTone;
}

const ICON_GRADIENT: Record<AccentTone, string> = {
  primary: "from-primary/10 via-primary/5 to-transparent text-primary ring-primary/10",
  teal: "from-chart-3/10 via-chart-3/5 to-transparent text-chart-3 ring-chart-3/15",
  purple: "from-chart-6/10 via-chart-6/5 to-transparent text-chart-6 ring-chart-6/15",
  pink: "from-chart-5/10 via-chart-5/5 to-transparent text-chart-5 ring-chart-5/15",
  amber: "from-warning/10 via-warning/5 to-transparent text-warning ring-warning/15",
  success: "from-success/10 via-success/5 to-transparent text-success ring-success/15",
  info: "from-info/10 via-info/5 to-transparent text-info ring-info/15",
  destructive: "from-destructive/10 via-destructive/5 to-transparent text-destructive ring-destructive/15",
};

export function PageHeader({
  title,
  description,
  children,
  className,
  icon,
  tone = "primary",
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        {icon && (
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ring-1",
              ICON_GRADIENT[tone],
            )}
          >
            {icon}
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {children}
        </div>
      )}
    </motion.div>
  );
}
