import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps): JSX.Element {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 className="text-xl font-bold text-bosque-oscuro">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-texto-suave">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
