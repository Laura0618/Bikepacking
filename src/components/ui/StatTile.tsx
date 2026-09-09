import type { ReactNode } from 'react';

type Tone = 'bosque' | 'recuperacion' | 'alerta' | 'neutro';

const TONE_CLASS: Record<Tone, string> = {
  bosque: 'border-bosque-suave bg-bosque-suave/50',
  recuperacion: 'border-recuperacion-claro bg-recuperacion-suave',
  alerta: 'border-alerta-claro bg-alerta-suave',
  neutro: 'border-bosque-suave bg-superficie',
};

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
}

export function StatTile({ label, value, hint, tone = 'neutro' }: StatTileProps): JSX.Element {
  return (
    <div className={`rounded-2xl border p-3 ${TONE_CLASS[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">{label}</p>
      <p className="mt-1 text-2xl font-bold text-texto">{value}</p>
      {hint && <p className="mt-1 text-xs text-texto-suave">{hint}</p>}
    </div>
  );
}
