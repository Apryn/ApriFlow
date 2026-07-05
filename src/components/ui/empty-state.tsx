import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <Icon className="h-6 w-6 text-teal-400" />
      </div>
      <p className="text-sm font-bold text-zinc-100">{title}</p>
      {description && <p className="mt-1.5 max-w-xs text-xs text-zinc-400 leading-relaxed">{description}</p>}
    </div>
  );
}
