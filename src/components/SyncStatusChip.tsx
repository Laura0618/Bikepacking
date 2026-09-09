import { useAppData } from '../store/AppDataProvider';
import type { SyncStatus } from '../types';

const LABEL: Record<SyncStatus, string> = {
  signed_out: 'Solo en este dispositivo',
  synced: 'Sincronizado',
  saving: 'Guardando...',
  pending: 'Pendiente de sincronizar',
  offline: 'Sin conexion',
  error: 'Error al sincronizar',
};

const TONE: Record<SyncStatus, string> = {
  signed_out: 'bg-fondo text-texto-suave',
  synced: 'bg-bosque-suave text-bosque-oscuro',
  saving: 'bg-recuperacion-suave text-recuperacion',
  pending: 'bg-alerta-suave text-alerta',
  offline: 'bg-alerta-suave text-alerta',
  error: 'bg-peligro-suave text-peligro',
};

const ICON: Record<SyncStatus, string> = {
  signed_out: '·',
  synced: '✓',
  saving: '⟳',
  pending: '•',
  offline: '⚡',
  error: '!',
};

export function SyncStatusChip(): JSX.Element | null {
  const { authStatus, syncStatus, syncNow } = useAppData();
  if (authStatus !== 'signed_in') return null;

  const clickable = syncStatus === 'error' || syncStatus === 'pending' || syncStatus === 'offline';

  return (
    <button
      type="button"
      onClick={() => clickable && syncNow()}
      disabled={!clickable}
      aria-live="polite"
      className={`inline-flex min-h-[28px] items-center gap-1 rounded-full px-2.5 text-xs font-semibold ${TONE[syncStatus]} ${
        clickable ? 'cursor-pointer' : 'cursor-default'
      }`}
      title={clickable ? 'Toca para reintentar' : LABEL[syncStatus]}
    >
      <span aria-hidden="true">{ICON[syncStatus]}</span>
      {LABEL[syncStatus]}
    </button>
  );
}
