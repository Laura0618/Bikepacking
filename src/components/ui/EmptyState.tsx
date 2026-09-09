import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
  icon?: string;
}

export function EmptyState({ title, message, action, icon = '🚲' }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-bosque-suave bg-superficie px-4 py-8 text-center">
      <span className="text-3xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="mt-2 text-base font-bold text-texto">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-texto-suave">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
