import type { AppAlert } from '../../types';

const LEVEL_CLASS: Record<AppAlert['level'], string> = {
  peligro: 'border-peligro-claro bg-peligro-suave text-peligro',
  alerta: 'border-alerta-claro bg-alerta-suave text-alerta',
  recuperacion: 'border-recuperacion-claro bg-recuperacion-suave text-recuperacion',
};

const LEVEL_ICON: Record<AppAlert['level'], string> = {
  peligro: '⚠️',
  alerta: '⚠️',
  recuperacion: '💧',
};

export function AlertBanner({ alert }: { alert: AppAlert }): JSX.Element {
  return (
    <div
      role={alert.level === 'recuperacion' ? 'status' : 'alert'}
      className={`rounded-2xl border p-3 ${LEVEL_CLASS[alert.level]}`}
    >
      <p className="flex items-center gap-2 text-sm font-bold">
        <span aria-hidden="true">{LEVEL_ICON[alert.level]}</span>
        {alert.title}
      </p>
      <p className="mt-1 text-sm text-texto">{alert.message}</p>
    </div>
  );
}
