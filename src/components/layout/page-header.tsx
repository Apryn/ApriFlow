interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-4 md:mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-lg font-black text-zinc-50 md:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-400 md:text-sm">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
