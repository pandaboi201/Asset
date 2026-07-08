import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface DetailRow {
  label: string;
  value: React.ReactNode;
}

export interface DetailSection {
  title?: string;
  rows: DetailRow[];
}

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerBadge?: React.ReactNode;
  headerExtra?: React.ReactNode;
  sections: DetailSection[];
  footer?: React.ReactNode;
  className?: string;
}

export function DetailSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  headerBadge,
  headerExtra,
  sections,
  footer,
  className,
}: DetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn("w-full sm:max-w-lg", className)}>
        <SheetHeader>
          {headerBadge && <div className="flex items-center gap-2">{headerBadge}</div>}
          <SheetTitle className="text-xl">{title}</SheetTitle>
          {subtitle && <SheetDescription>{subtitle}</SheetDescription>}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {headerExtra && <div className="mb-4">{headerExtra}</div>}
            {sections.map((section, i) => (
              <div key={i}>
                {i > 0 && <Separator className="my-4" />}
                {section.title && (
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.title}
                  </p>
                )}
                <div className="divide-y">
                  {section.rows.map((row, r) => (
                    <div
                      key={r}
                      className="flex items-center justify-between gap-4 py-2.5"
                    >
                      <span className="text-sm text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="text-right text-sm font-medium">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {footer && <SheetFooter>{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}
