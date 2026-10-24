import { cn } from "@/lib/utils/cn";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

/** Inline feedback message (error / success). */
export function Alert({
  variant = "error",
  children,
  className,
}: {
  variant?: "error" | "success";
  children: ReactNode;
  className?: string;
}) {
  const isError = variant === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-medium animate-fade-in",
        isError
          ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
          : "border-teal-400/40 bg-teal-400/10 text-teal-300",
        className
      )}
    >
      <Icon className="mt-px h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
