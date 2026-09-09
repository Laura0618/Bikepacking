// Alertas de recuperacion y seguridad. Logica pura y testeable.

import type { AppAlert, Workout } from '../types';
import { addDays, todayISO } from './dates';

export const PAIN_THRESHOLD = 5;
/** Incremento de duracion considerado brusco (fraccion sobre la salida previa). */
export const DURATION_JUMP_RATIO = 0.2;
/** Incremento de carga considerado brusco (kg sobre la salida previa). */
export const LOAD_JUMP_KG = 2;

function isDone(w: Workout): boolean {
  return w.status === 'completed' || w.status === 'partial';
}

function minutesOf(w: Workout): number {
  if (w.actualDurationMinutes !== null && w.actualDurationMinutes !== undefined) {
    return w.actualDurationMinutes;
  }
  return w.status === 'completed' ? w.plannedDurationMinutes : 0;
}

/** Alerta por dolor alto en una salida concreta. */
export function painAlert(workout: Workout): AppAlert | null {
  if (workout.painLevel !== undefined && workout.painLevel >= PAIN_THRESHOLD) {
    return {
      id: `pain-${workout.id}`,
      level: 'alerta',
      title: 'Dolor elevado registrado',
      message:
        `Registraste dolor ${workout.painLevel}/10. Para, descansa y no fuerces. ` +
        'Si el dolor persiste varios dias, consulta a un profesional de la salud antes de seguir.',
    };
  }
  return null;
}

/**
 * Alerta cuando la ultima salida hecha sube a la vez la duracion (>20%) y la carga (>2 kg)
 * respecto a la salida anterior con carga comparable.
 */
export function progressionAlert(workouts: Workout[]): AppAlert | null {
  const done = workouts
    .filter(isDone)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (done.length < 2) return null;
  const last = done[done.length - 1];
  const prev = done[done.length - 2];
  if (!last || !prev) return null;

  const prevMinutes = minutesOf(prev);
  const lastMinutes = minutesOf(last);
  if (prevMinutes <= 0) return null;

  const durationJump = (lastMinutes - prevMinutes) / prevMinutes;
  const loadJump = last.loadKg - prev.loadKg;

  if (durationJump > DURATION_JUMP_RATIO && loadJump > LOAD_JUMP_KG) {
    return {
      id: `progression-${last.id}`,
      level: 'alerta',
      title: 'Salto de carga y duracion a la vez',
      message:
        'Esta salida sube mucho la duracion y el peso al mismo tiempo. ' +
        'Sube solo una variable cada vez: primero el tiempo, y en otra semana el equipaje.',
    };
  }
  return null;
}

/** Alerta suave si se acumulan muchos dias seguidos sin descanso. */
export function recoveryAlert(workouts: Workout[], refISO: string = todayISO()): AppAlert | null {
  const doneDates = new Set(workouts.filter(isDone).map((w) => w.date));
  let streak = 0;
  let cursor = refISO;
  while (doneDates.has(cursor) && streak < 30) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  if (streak >= 6) {
    return {
      id: 'recovery-streak',
      level: 'recuperacion',
      title: 'Toca recuperar',
      message: `Llevas ${streak} dias seguidos pedaleando. Programa un dia facil o de descanso para asimilar la carga.`,
    };
  }
  return null;
}

/** Todas las alertas activas, con las de seguridad primero. */
export function collectAlerts(workouts: Workout[], refISO: string = todayISO()): AppAlert[] {
  const alerts: AppAlert[] = [];
  const recentDone = workouts
    .filter((w) => isDone(w) && w.date <= refISO && w.date >= addDays(refISO, -10))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  for (const w of recentDone) {
    const alert = painAlert(w);
    if (alert) {
      alerts.push(alert);
      break;
    }
  }

  const progression = progressionAlert(workouts);
  if (progression) alerts.push(progression);

  const recovery = recoveryAlert(workouts, refISO);
  if (recovery) alerts.push(recovery);

  return alerts;
}
