// Etiquetas legibles en espanol para los valores del modelo de datos.

import type { Intensity, WorkoutStatus, WorkoutType } from '../types';

export const WORKOUT_TYPE_LABEL: Record<WorkoutType, string> = {
  suave: 'Suave',
  moderado: 'Moderado',
  salida_larga: 'Salida larga',
  recuperacion: 'Recuperacion',
  cargada: 'Con equipaje',
  simulacion: 'Simulacion de viaje',
  descanso: 'Descanso',
};

export const INTENSITY_LABEL: Record<Intensity, string> = {
  muy_suave: 'Muy suave',
  suave: 'Suave',
  moderado: 'Moderado',
  exigente: 'Exigente',
};

export const STATUS_LABEL: Record<WorkoutStatus, string> = {
  planned: 'Planificado',
  completed: 'Completado',
  partial: 'Parcial',
  skipped: 'No realizada',
};

/** Marca corta e independiente del color para calendarios densos. */
export const STATUS_MARK: Record<WorkoutStatus, string> = {
  planned: '·',
  completed: '✓',
  partial: '~',
  skipped: '×',
};

/** Anclajes verbales de la escala de dolor 0-10 (mejores practicas UX). */
export const PAIN_ANCHORS: { value: number; label: string }[] = [
  { value: 0, label: 'Sin dolor' },
  { value: 3, label: 'Molesto pero estable' },
  { value: 5, label: 'Me hizo cambiar la salida' },
  { value: 7, label: 'Me obligo a parar' },
  { value: 10, label: 'Dolor intenso' },
];

/** Anclajes verbales del esfuerzo percibido 1-10. */
export const EFFORT_ANCHORS: { value: number; label: string }[] = [
  { value: 2, label: 'Muy facil' },
  { value: 4, label: 'Comodo' },
  { value: 6, label: 'Algo exigente' },
  { value: 8, label: 'Duro' },
  { value: 10, label: 'Maximo' },
];

export function painAnchorText(value: number): string {
  const sorted = [...PAIN_ANCHORS].sort((a, b) => b.value - a.value);
  return sorted.find((a) => value >= a.value)?.label ?? 'Sin dolor';
}

export function effortAnchorText(value: number): string {
  const sorted = [...EFFORT_ANCHORS].sort((a, b) => b.value - a.value);
  return sorted.find((a) => value >= a.value)?.label ?? 'Muy facil';
}

export const STATUS_TONE: Record<WorkoutStatus, 'bosque' | 'recuperacion' | 'alerta' | 'neutro'> = {
  planned: 'neutro',
  completed: 'bosque',
  partial: 'recuperacion',
  skipped: 'alerta',
};

export const WORKOUT_TYPES: WorkoutType[] = [
  'suave',
  'moderado',
  'salida_larga',
  'recuperacion',
  'cargada',
  'simulacion',
  'descanso',
];

export const INTENSITIES: Intensity[] = ['muy_suave', 'suave', 'moderado', 'exigente'];

export const WEEKDAY_LABELS: readonly string[] = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
];
