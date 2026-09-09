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
  skipped: 'Saltado',
};

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
