// Deteccion automatica de hitos a partir del historial de entrenamientos.

import type { Milestone, MilestoneId, Workout } from '../types';
import { addDays, diffInDays, nowISO } from './dates';

export const MILESTONE_DEFS: ReadonlyArray<{
  id: MilestoneId;
  label: string;
  condition: string;
}> = [
  {
    id: 'noventa_min',
    label: '90 minutos comodos',
    condition: 'Una salida de 90 min o mas con dolor menor que 5/10.',
  },
  {
    id: 'dos_horas',
    label: '2 horas seguidas',
    condition: 'Una salida de 120 min o mas completada.',
  },
  {
    id: 'finde_consecutivo',
    label: 'Fin de semana consecutivo',
    condition: 'Sabado y domingo seguidos con salida en ambos dias.',
  },
  {
    id: 'tres_horas_cargada',
    label: '3 horas con equipaje',
    condition: 'Una salida de 180 min o mas con 5 kg o mas de carga.',
  },
  {
    id: 'bloque_tres_dias',
    label: 'Bloque de 3 dias',
    condition: 'Tres dias consecutivos con salida.',
  },
  {
    id: 'simulacion_cuatro_dias',
    label: 'Simulacion de 4 dias',
    condition: 'Cuatro dias consecutivos con salida.',
  },
];

export function initialMilestones(): Milestone[] {
  const stamp = nowISO();
  return MILESTONE_DEFS.map((def) => ({ ...def, achievedAt: null, updatedAt: stamp, deletedAt: null }));
}

function isDone(w: Workout): boolean {
  return w.status === 'completed' || w.status === 'partial';
}

function minutesOf(w: Workout): number {
  if (w.actualDurationMinutes !== null && w.actualDurationMinutes !== undefined) {
    return w.actualDurationMinutes;
  }
  return w.status === 'completed' ? w.plannedDurationMinutes : 0;
}

/** Fecha (ISO) mas temprana en la que se cumple cada hito, o null. */
export function detectMilestoneDates(workouts: Workout[]): Record<MilestoneId, string | null> {
  const done = workouts
    .filter(isDone)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const doneDates = Array.from(new Set(done.map((w) => w.date))).sort();

  const firstMatch = (pred: (w: Workout) => boolean): string | null => {
    const hit = done.find(pred);
    return hit ? hit.date : null;
  };

  const noventa = firstMatch((w) => minutesOf(w) >= 90 && (w.painLevel ?? 0) < 5);
  const dosHoras = firstMatch((w) => minutesOf(w) >= 120);
  const tresCargada = firstMatch((w) => minutesOf(w) >= 180 && w.loadKg >= 5);

  const findeConsecutivo = ((): string | null => {
    for (const w of done) {
      const d = new Date(w.date + 'T00:00:00');
      if (d.getDay() !== 6) continue; // sabado
      const domingo = addDays(w.date, 1);
      if (doneDates.includes(domingo)) return domingo;
    }
    return null;
  })();

  const consecutiveRunEndingDate = (length: number): string | null => {
    let run = 0;
    let prev: string | null = null;
    for (const date of doneDates) {
      run = prev !== null && diffInDays(prev, date) === 1 ? run + 1 : 1;
      if (run >= length) return date;
      prev = date;
    }
    return null;
  };

  return {
    noventa_min: noventa,
    dos_horas: dosHoras,
    finde_consecutivo: findeConsecutivo,
    tres_horas_cargada: tresCargada,
    bloque_tres_dias: consecutiveRunEndingDate(3),
    simulacion_cuatro_dias: consecutiveRunEndingDate(4),
  };
}

/** Devuelve la lista de hitos actualizada; conserva `achievedAt` ya fijado. */
export function reconcileMilestones(current: Milestone[], workouts: Workout[]): Milestone[] {
  const detected = detectMilestoneDates(workouts);
  const byId = new Map(current.map((m) => [m.id, m]));
  return MILESTONE_DEFS.map((def) => {
    const existing = byId.get(def.id);
    const alreadyAt = existing?.achievedAt ?? null;
    const detectedAt = detected[def.id];
    const achievedAt = alreadyAt ?? detectedAt;
    const changed = achievedAt !== (existing?.achievedAt ?? null);
    return {
      id: def.id,
      label: def.label,
      condition: def.condition,
      achievedAt,
      updatedAt: changed || !existing ? nowISO() : existing.updatedAt,
      deletedAt: existing?.deletedAt ?? null,
    };
  });
}

/** Hitos recien conseguidos comparando estado previo y nuevo. */
export function newlyAchieved(previous: Milestone[], next: Milestone[]): Milestone[] {
  const prevById = new Map(previous.map((m) => [m.id, m]));
  return next.filter((m) => m.achievedAt !== null && !prevById.get(m.id)?.achievedAt);
}
