import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Compact variant for use inside cards/widgets. */
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-5" : "py-12",
        className
      )}
    >
      <div
        className={cn(
          "mb-3 flex items-center justify-center rounded-xl border-2 border-black bg-zinc-800 shadow-nb-sm",
          compact ? "h-9 w-9" : "h-12 w-12"
        )}
      >
        <Icon className={cn("text-teal-400", compact ? "h-4 w-4" : "h-5 w-5")} />
      </div>
      <p className="text-sm font-semibold text-zinc-100">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
