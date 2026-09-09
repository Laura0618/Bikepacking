// Valores validos del dominio como arrays en runtime.
// Fuente unica que comparten el frontend y la validacion del Worker.
// Los `satisfies` garantizan que no se desvien de los tipos de `../types`.

import type { Intensity, MilestoneId, WorkoutStatus, WorkoutType } from '../types';

export const WORKOUT_TYPES = [
  'suave',
  'moderado',
  'salida_larga',
  'recuperacion',
  'cargada',
  'simulacion',
  'descanso',
] as const satisfies readonly WorkoutType[];

export const INTENSITIES = [
  'muy_suave',
  'suave',
  'moderado',
  'exigente',
] as const satisfies readonly Intensity[];

export const WORKOUT_STATUSES = [
  'planned',
  'completed',
  'partial',
  'skipped',
] as const satisfies readonly WorkoutStatus[];

export const MILESTONE_IDS = [
  'noventa_min',
  'dos_horas',
  'finde_consecutivo',
  'tres_horas_cargada',
  'bloque_tres_dias',
  'simulacion_cuatro_dias',
] as const satisfies readonly MilestoneId[];

export function isWorkoutType(v: unknown): v is WorkoutType {
  return typeof v === 'string' && (WORKOUT_TYPES as readonly string[]).includes(v);
}

export function isIntensity(v: unknown): v is Intensity {
  return typeof v === 'string' && (INTENSITIES as readonly string[]).includes(v);
}

export function isWorkoutStatus(v: unknown): v is WorkoutStatus {
  return typeof v === 'string' && (WORKOUT_STATUSES as readonly string[]).includes(v);
}

export function isMilestoneId(v: unknown): v is MilestoneId {
  return typeof v === 'string' && (MILESTONE_IDS as readonly string[]).includes(v);
}
