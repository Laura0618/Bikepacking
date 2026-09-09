import { useNavigate } from 'react-router-dom';
import { useAppData } from '../store/AppDataProvider';
import type { SyncStatus } from '../types';

type ChipState = SyncStatus | 'loading';

// Etiqueta corta para el chip de la cabecera (discreto).
const LABEL: Record<ChipState, string> = {
  loading: 'Comprobando sesion...',
  signed_out: 'Inicia sesion',
  synced: 'Sincronizado',
  saving: 'Guardando...',
  pending: 'Pendiente de sincronizar',
  offline: 'Sin conexion',
  error: 'Error al sincronizar',
};

const TONE: Record<ChipState, string> = {
  loading: 'bg-fondo text-texto-suave',
  signed_out: 'bg-fondo text-texto-suave',
  synced: 'bg-bosque-suave text-bosque-oscuro',
  saving: 'bg-recuperacion-suave text-recuperacion',
  pending: 'bg-alerta-suave text-alerta',
  offline: 'bg-alerta-suave text-alerta',
  error: 'bg-peligro-suave text-peligro',
};

const ICON: Record<ChipState, string> = {
  loading: '·',
  signed_out: '·',
  synced: '✓',
  saving: '⟳',
  pending: '•',
  offline: '⚡',
  error: '!',
};

export function SyncStatusChip(): JSX.Element | null {
  const { authStatus, syncStatus, syncNow } = useAppData();
  const navigate = useNavigate();

  if (authStatus === 'loading') return null;

  const state: ChipState = authStatus === 'signed_in' ? syncStatus : 'signed_out';

  const onClick = (): void => {
    if (state === 'signed_out') navigate('/ajustes');
    else if (state === 'error' || state === 'pending' || state === 'offline') syncNow();
  };
  const clickable =
    state === 'signed_out' || state === 'error' || state === 'pending' || state === 'offline';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      aria-live="polite"
      className={`inline-flex min-h-[28px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ${TONE[state]} ${
        clickable ? 'cursor-pointer' : 'cursor-default'
      }`}
      title={
        state === 'signed_out'
          ? 'Inicia sesion para sincronizar entre dispositivos'
          : LABEL[state]
      }
    >
      <span aria-hidden="true">{ICON[state]}</span>
      {LABEL[state]}
    </button>
  );
}
