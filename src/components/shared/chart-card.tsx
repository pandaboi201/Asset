import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      <Card className="h-full overflow-hidden border-border/50 transition-shadow duration-200 hover:shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-[12px]">
                {description}
              </CardDescription>
            )}
          </div>
          {action}
        </CardHeader>
        <CardContent className={cn("pt-2", contentClassName)}>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border/50 p-6", className)}>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-2 h-3.5 w-56" />
      <Skeleton className="mt-6 h-[240px] w-full rounded-lg" />
    </Card>
  );
}
