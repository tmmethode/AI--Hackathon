import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-muted sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">{actions}</div>}
    </div>
  );
}
