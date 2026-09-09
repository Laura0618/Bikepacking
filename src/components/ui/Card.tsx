import type { ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, action, children, className = '' }: CardProps): JSX.Element {
  return (
    <section className={`tarjeta ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title ? (
            <h2 className="text-base font-bold text-texto">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
