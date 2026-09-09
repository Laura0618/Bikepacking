// Selectores derivados sobre el estado, para las vistas.

import type { StrengthSession, Workout } from '../types';
import { addDays, startOfWeek, todayISO } from './dates';

export function sortByDate<T extends { date: string }>(items: T[]): T[] {
  return items.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function workoutsOnDate(workouts: Workout[], dateISO: string): Workout[] {
  return sortByDate(workouts.filter((w) => w.date === dateISO));
}

export function nextPlannedWorkout(
  workouts: Workout[],
  refISO: string = todayISO(),
): Workout | null {
  const upcoming = sortByDate(
    workouts.filter(
      (w) => w.status === 'planned' && w.workoutType !== 'descanso' && w.date >= refISO,
    ),
  );
  return upcoming[0] ?? null;
}

export function upcomingWorkouts(
  workouts: Workout[],
  count: number,
  refISO: string = todayISO(),
): Workout[] {
  return sortByDate(workouts.filter((w) => w.date >= refISO)).slice(0, count);
}

export interface WeekSummary {
  weekStart: string;
  plannedSessions: number;
  doneSessions: number;
  strengthPlanned: number;
  strengthDone: number;
}

export function weekSummary(
  workouts: Workout[],
  strengthSessions: StrengthSession[],
  refISO: string = todayISO(),
): WeekSummary {
  const weekStart = startOfWeek(refISO);
  const weekEnd = addDays(weekStart, 6);
  const inWeek = workouts.filter(
    (w) => w.date >= weekStart && w.date <= weekEnd && w.workoutType !== 'descanso',
  );
  const strengthInWeek = strengthSessions.filter(
    (s) => s.date >= weekStart && s.date <= weekEnd,
  );
  const isDone = (status: string): boolean => status === 'completed' || status === 'partial';
  return {
    weekStart,
    plannedSessions: inWeek.length,
    doneSessions: inWeek.filter((w) => isDone(w.status)).length,
    strengthPlanned: strengthInWeek.length,
    strengthDone: strengthInWeek.filter((s) => isDone(s.status)).length,
  };
}
