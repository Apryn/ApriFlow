import { cn } from "@/lib/utils/cn";

export function Logo({ className, withTagline = false }: { className?: string; withTagline?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-black bg-teal-400 text-xs font-black text-black shadow-nb-sm">
        A
      </span>
      <span className="leading-tight">
        <span className="block text-base font-extrabold tracking-tight text-zinc-50">ApriFlow</span>
        {withTagline && <span className="block text-[11px] text-zinc-500">Cash flow pribadi</span>}
      </span>
    </span>
  );
}
