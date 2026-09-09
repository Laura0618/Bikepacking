// Calculos de metricas de entrenamiento. Logica pura y testeable.

import type {
  ConsecutiveDaysPoint,
  LoadPoint,
  LongestRidePoint,
  WeeklyHoursPoint,
  Workout,
} from '../types';
import {
  addDays,
  diffInDays,
  formatShortDate,
  startOfWeek,
  todayISO,
  weekStartsBetween,
} from './dates';
import { isDeloadWeek } from './plan';

/** Minutos efectivos de un workout: reales si existen, si no los planificados cuando está completado. */
function effectiveMinutes(w: Workout): number {
  if (w.actualDurationMinutes !== null && w.actualDurationMinutes !== undefined) {
    return Math.max(0, w.actualDurationMinutes);
  }
  if (w.status === 'completed') return Math.max(0, w.plannedDurationMinutes);
  return 0;
}

function countsAsDone(w: Workout): boolean {
  return w.status === 'completed' || w.status === 'partial';
}

/** Horas realizadas en la semana ISO que contiene `refISO`. */
export function weeklyActualHours(workouts: Workout[], refISO: string): number {
  const weekStart = startOfWeek(refISO);
  const total = workouts
    .filter((w) => startOfWeek(w.date) === weekStart && countsAsDone(w))
    .reduce((sum, w) => sum + effectiveMinutes(w), 0);
  return round1(total / 60);
}

/** Horas planificadas en la semana ISO que contiene `refISO`. */
export function weeklyPlannedHours(workouts: Workout[], refISO: string): number {
  const weekStart = startOfWeek(refISO);
  const total = workouts
    .filter((w) => startOfWeek(w.date) === weekStart && w.status !== 'skipped')
    .reduce((sum, w) => sum + Math.max(0, w.plannedDurationMinutes), 0);
  return round1(total / 60);
}

/** Duracion de la salida mas larga realizada (en minutos). */
export function longestRideMinutes(workouts: Workout[]): number {
  return workouts
    .filter(countsAsDone)
    .reduce((max, w) => Math.max(max, effectiveMinutes(w)), 0);
}

/** Carga de equipaje actual: mayor loadKg entre las salidas hechas en los ultimos 21 dias. */
export function currentLoadKg(workouts: Workout[], refISO: string = todayISO()): number {
  const since = addDays(refISO, -21);
  const recent = workouts.filter(
    (w) => countsAsDone(w) && w.date <= refISO && w.date >= since,
  );
  if (recent.length === 0) return 0;
  return recent.reduce((max, w) => Math.max(max, w.loadKg), 0);
}

/** Racha actual de dias consecutivos con algo hecho, contando hacia atras desde hoy o ayer. */
export function currentStreakDays(workouts: Workout[], refISO: string = todayISO()): number {
  const doneDates = new Set(workouts.filter(countsAsDone).map((w) => w.date));
  if (doneDates.size === 0) return 0;
  let anchor = refISO;
  if (!doneDates.has(anchor)) {
    anchor = addDays(refISO, -1);
    if (!doneDates.has(anchor)) return 0;
  }
  let streak = 0;
  let cursor = anchor;
  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Racha maxima de dias consecutivos con entrenamiento hecho en todo el historial. */
export function longestStreakDays(workouts: Workout[]): number {
  const doneDates = Array.from(new Set(workouts.filter(countsAsDone).map((w) => w.date))).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of doneDates) {
    if (prev !== null && diffInDays(prev, date) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

/** Racha maxima de dias consecutivos hechos dentro de una semana ISO. */
export function streakWithinWeek(workouts: Workout[], weekStartISO: string): number {
  const weekEnd = addDays(weekStartISO, 6);
  const inWeek = workouts.filter(
    (w) => countsAsDone(w) && w.date >= weekStartISO && w.date <= weekEnd,
  );
  return longestStreakDays(inWeek);
}

export function weeklyHoursSeries(
  workouts: Workout[],
  fromISO: string,
  toISO: string,
): WeeklyHoursPoint[] {
  return weekStartsBetween(fromISO, toISO).map((weekStart) => {
    const planWeeks = workouts
      .filter((w) => startOfWeek(w.date) === weekStart && w.planWeek !== undefined)
      .map((w) => w.planWeek as number);
    const planWeek = planWeeks.length > 0 ? Math.min(...planWeeks) : null;
    return {
      weekStart,
      label: formatShortDate(weekStart),
      plannedHours: weeklyPlannedHours(workouts, weekStart),
      actualHours: weeklyActualHours(workouts, weekStart),
      isDeload: planWeek !== null && isDeloadWeek(planWeek),
    };
  });
}

export function longestRideSeries(
  workouts: Workout[],
  fromISO: string,
  toISO: string,
): LongestRidePoint[] {
  return weekStartsBetween(fromISO, toISO).map((weekStart) => {
    const weekEnd = addDays(weekStart, 6);
    const minutes = workouts
      .filter((w) => countsAsDone(w) && w.date >= weekStart && w.date <= weekEnd)
      .reduce((max, w) => Math.max(max, effectiveMinutes(w)), 0);
    return { weekStart, label: formatShortDate(weekStart), minutes };
  });
}

export function loadSeries(workouts: Workout[], fromISO: string, toISO: string): LoadPoint[] {
  return weekStartsBetween(fromISO, toISO).map((weekStart) => {
    const weekEnd = addDays(weekStart, 6);
    const maxLoadKg = workouts
      .filter((w) => countsAsDone(w) && w.date >= weekStart && w.date <= weekEnd)
      .reduce((max, w) => Math.max(max, w.loadKg), 0);
    return { weekStart, label: formatShortDate(weekStart), maxLoadKg };
  });
}

export function consecutiveDaysSeries(
  workouts: Workout[],
  fromISO: string,
  toISO: string,
): ConsecutiveDaysPoint[] {
  return weekStartsBetween(fromISO, toISO).map((weekStart) => ({
    weekStart,
    label: formatShortDate(weekStart),
    streak: streakWithinWeek(workouts, weekStart),
  }));
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
