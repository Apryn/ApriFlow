import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  /** Shows a small back link above the title (for sub-pages). */
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({ title, subtitle, action, backHref, backLabel = "Kembali" }: PageHeaderProps) {
  return (
    <div className="mb-5 md:mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-2 inline-flex items-center gap-0.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-zinc-50 md:text-2xl">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-zinc-500">{subtitle}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
