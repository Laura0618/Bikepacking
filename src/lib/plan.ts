// Generacion del plan de seis meses a partir de la fecha de inicio.
// La logica es pura y deterministica para poder testearla.

import type { PlanMonth, StrengthSession, Workout } from '../types';
import { addDays, nowISO, startOfWeek } from './dates';
import {
  DELOAD_FACTORS,
  MONTH_BASES,
  monthNumberOfWeek,
  PLAN_MONTHS_META,
  SPECIAL_WEEKS,
  STRENGTH_MINUTES,
  TAPER_WEEKS,
  TOTAL_PLAN_WEEKS,
  weekWithinMonth,
  type SessionTemplate,
} from './planTemplates';

export interface GeneratedPlan {
  months: PlanMonth[];
  workouts: Workout[];
  strengthSessions: StrengthSession[];
}

export function isDeloadWeek(planWeek: number): boolean {
  return planWeek in DELOAD_FACTORS;
}

export function isTaperWeek(planWeek: number): boolean {
  return TAPER_WEEKS.includes(planWeek);
}

export function deloadFactor(planWeek: number): number {
  return DELOAD_FACTORS[planWeek] ?? 1;
}

function roundTo5(value: number): number {
  return Math.round(value / 5) * 5;
}

function applyDeload(minutes: number, planWeek: number): number {
  if (minutes <= 0) return 0;
  const factor = deloadFactor(planWeek);
  if (factor === 1) return minutes;
  return Math.max(15, roundTo5(minutes * factor));
}

/** Sesiones de bici para una semana concreta del plan (1-24). */
export function sessionsForWeek(planWeek: number): SessionTemplate[] {
  const month = monthNumberOfWeek(planWeek);
  if (month <= 4) {
    const base = MONTH_BASES[month];
    if (!base) return [];
    const override = base.loadOverrideByWeek?.[planWeek];
    return base.sessions.map((session) => {
      const isWeekend = session.dayOffset === 5 || session.dayOffset === 6;
      const loadKg =
        override !== undefined && isWeekend && session.loadKg > 0 ? override : session.loadKg;
      return { ...session, loadKg, minutes: applyDeload(session.minutes, planWeek) };
    });
  }
  const special = SPECIAL_WEEKS[planWeek];
  if (!special) return [];
  return special.sessions.map((session) => ({
    ...session,
    minutes: applyDeload(session.minutes, planWeek),
  }));
}

function strengthOffsetsForWeek(planWeek: number): number[] {
  const month = monthNumberOfWeek(planWeek);
  if (month <= 4) {
    const base = MONTH_BASES[month];
    if (!base) return [];
    // En semanas de descarga se mantiene una sola sesion de fuerza.
    if (isDeloadWeek(planWeek)) return base.strengthDayOffsets.slice(0, 1);
    return base.strengthDayOffsets;
  }
  return SPECIAL_WEEKS[planWeek]?.strengthDayOffsets ?? [];
}

export function generatePlan(startDateISO: string, stamp: string = nowISO()): GeneratedPlan {
  const week1Monday = startOfWeek(startDateISO);
  const workouts: Workout[] = [];
  const strengthSessions: StrengthSession[] = [];
  const workoutIdsByMonth = new Map<number, string[]>();

  for (let planWeek = 1; planWeek <= TOTAL_PLAN_WEEKS; planWeek += 1) {
    const month = monthNumberOfWeek(planWeek);
    const weekStart = addDays(week1Monday, (planWeek - 1) * 7);
    const list = workoutIdsByMonth.get(month) ?? [];

    for (const session of sessionsForWeek(planWeek)) {
      const id = `plan-w${planWeek}-d${session.dayOffset}-${session.workoutType}`;
      workouts.push({
        id,
        date: addDays(weekStart, session.dayOffset),
        plannedDurationMinutes: session.minutes,
        actualDurationMinutes: null,
        workoutType: session.workoutType,
        intensity: session.intensity,
        loadKg: session.loadKg,
        notes: session.note,
        status: 'planned',
        fromPlan: true,
        planMonth: month,
        planWeek,
        updatedAt: stamp,
        deletedAt: null,
      });
      list.push(id);
    }
    workoutIdsByMonth.set(month, list);

    strengthOffsetsForWeek(planWeek).forEach((dayOffset, index) => {
      strengthSessions.push({
        id: `plan-strength-w${planWeek}-${index}`,
        date: addDays(weekStart, dayOffset),
        exercises: [
          'sentadilla',
          'zancada',
          'peso_muerto_rumano',
          'puente_gluteo',
          'plancha',
          'perro_pajaro',
        ],
        status: 'planned',
        notes: `Fuerza ${STRENGTH_MINUTES} min (20-25 min).`,
        fromPlan: true,
        planWeek,
        updatedAt: stamp,
        deletedAt: null,
      });
    });
  }

  const months: PlanMonth[] = PLAN_MONTHS_META.map((meta) => ({
    monthNumber: meta.monthNumber,
    weeklyHoursMin: meta.weeklyHoursMin,
    weeklyHoursMax: meta.weeklyHoursMax,
    longestRideMinutes: meta.longestRideMinutes,
    focus: meta.focus,
    workouts: workoutIdsByMonth.get(meta.monthNumber) ?? [],
  }));

  return { months, workouts, strengthSessions };
}

/** Texto de hito recomendado por mes (solo informativo en la vista de plan). */
export const MONTH_MILESTONE_HINTS: Record<number, string> = {
  1: '90 min comodos y sin dolor importante al dia siguiente.',
  2: 'Completar 2 h seguidas y la primera semana de descarga.',
  3: 'Dos fines de semana con sabado y domingo consecutivos.',
  4: 'Salida de 3 h tolerando 7-8 kg de equipaje.',
  5: 'Bloque especial de tres dias con equipaje.',
  6: 'Simulacion de cuatro dias consecutivos con equipaje definitivo.',
};

export { weekWithinMonth, monthNumberOfWeek };
