import type { ReactNode } from 'react';

type Tone = 'bosque' | 'recuperacion' | 'alerta' | 'neutro';

const TONE_CLASS: Record<Tone, string> = {
  bosque: 'bg-bosque-suave text-bosque-oscuro',
  recuperacion: 'bg-recuperacion-suave text-recuperacion',
  alerta: 'bg-alerta-suave text-alerta',
  neutro: 'bg-fondo text-texto-suave',
};

export function Badge({ tone = 'neutro', children }: { tone?: Tone; children: ReactNode }): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}
