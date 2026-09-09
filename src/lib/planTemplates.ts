// Plantillas del plan obligatorio de seis meses (24 semanas, 4 por mes).
// Estos son los unicos datos precargados de la aplicacion.

import type { Intensity, WorkoutType } from '../types';

export interface SessionTemplate {
  /** Dias desde el lunes de la semana (0 = lunes ... 6 = domingo). */
  dayOffset: number;
  workoutType: WorkoutType;
  intensity: Intensity;
  /** Duracion planificada en minutos, antes de aplicar descarga. */
  minutes: number;
  loadKg: number;
  note: string;
}

export interface MonthBase {
  sessions: SessionTemplate[];
  /** Dias (offset desde lunes) con sesion de fuerza en semanas normales. */
  strengthDayOffsets: number[];
  /** Sobrescribe loadKg de las salidas de fin de semana por semana del plan. */
  loadOverrideByWeek?: Record<number, number>;
}

export interface PlanMonthMeta {
  monthNumber: number;
  weeklyHoursMin: number;
  weeklyHoursMax: number;
  longestRideMinutes: number;
  focus: string;
}

export const PLAN_MONTHS_META: PlanMonthMeta[] = [
  {
    monthNumber: 1,
    weeklyHoursMin: 2.5,
    weeklyHoursMax: 3.5,
    longestRideMinutes: 90,
    focus: 'Consistencia y adaptacion inicial. Sin dolor importante al dia siguiente.',
  },
  {
    monthNumber: 2,
    weeklyHoursMin: 3.5,
    weeklyHoursMax: 4.75,
    longestRideMinutes: 120,
    focus: 'Volumen suave y primeros bloques moderados. Primera semana de descarga.',
  },
  {
    monthNumber: 3,
    weeklyHoursMin: 5,
    weeklyHoursMax: 6,
    longestRideMinutes: 150,
    focus: 'Salidas largas y fines de semana con sabado y domingo consecutivos.',
  },
  {
    monthNumber: 4,
    weeklyHoursMin: 6,
    weeklyHoursMax: 7.5,
    longestRideMinutes: 180,
    focus: 'Tolerancia a 3 h y carga progresiva de equipaje de 3-4 kg a 7-8 kg.',
  },
  {
    monthNumber: 5,
    weeklyHoursMin: 7,
    weeklyHoursMax: 8.5,
    longestRideMinutes: 180,
    focus: 'Dias consecutivos con equipaje y bloque especial de tres dias.',
  },
  {
    monthNumber: 6,
    weeklyHoursMin: 4,
    weeklyHoursMax: 7.5,
    longestRideMinutes: 180,
    focus: 'Simulacion de cuatro dias con equipaje definitivo y afinamiento antes del viaje.',
  },
];

/** Semanas del plan con descarga y su factor de reduccion sobre la duracion. */
export const DELOAD_FACTORS: Record<number, number> = {
  8: 0.7, // Mes 2, semana 4: descarga del 30%.
  12: 0.7, // Mes 3, semana 4.
  16: 0.7, // Mes 4, semana 4.
  23: 0.6, // Mes 6, semana 3: reduccion del 40%.
};

/** Semana de afinamiento final (taper) antes del viaje. */
export const TAPER_WEEKS: number[] = [24];

export function monthNumberOfWeek(planWeek: number): number {
  return Math.floor((planWeek - 1) / 4) + 1;
}

export function weekWithinMonth(planWeek: number): number {
  return ((planWeek - 1) % 4) + 1;
}

// Meses 1-4: una plantilla base por mes; la semana 4 aplica descarga.
export const MONTH_BASES: Record<number, MonthBase> = {
  1: {
    sessions: [
      { dayOffset: 1, workoutType: 'suave', intensity: 'suave', minutes: 45, loadKg: 0, note: 'Martes suave, cadencia comoda.' },
      { dayOffset: 3, workoutType: 'suave', intensity: 'suave', minutes: 52, loadKg: 0, note: 'Jueves suave 45-60 min.' },
      { dayOffset: 5, workoutType: 'salida_larga', intensity: 'suave', minutes: 82, loadKg: 0, note: 'Fin de semana suave 75-90 min.' },
    ],
    strengthDayOffsets: [0, 3],
  },
  2: {
    sessions: [
      { dayOffset: 1, workoutType: 'suave', intensity: 'suave', minutes: 60, loadKg: 0, note: 'Martes suave 60 min.' },
      { dayOffset: 3, workoutType: 'moderado', intensity: 'moderado', minutes: 60, loadKg: 0, note: '60 min con 3 bloques de 6 min moderados.' },
      { dayOffset: 5, workoutType: 'salida_larga', intensity: 'suave', minutes: 112, loadKg: 0, note: 'Sabado suave 1:45-2:00 h.' },
      { dayOffset: 6, workoutType: 'recuperacion', intensity: 'muy_suave', minutes: 45, loadKg: 0, note: 'Domingo opcional muy suave 40-50 min.' },
    ],
    strengthDayOffsets: [0, 4],
  },
  3: {
    sessions: [
      { dayOffset: 1, workoutType: 'suave', intensity: 'suave', minutes: 60, loadKg: 0, note: 'Martes suave 60 min.' },
      { dayOffset: 3, workoutType: 'moderado', intensity: 'moderado', minutes: 75, loadKg: 0, note: '75 min con 4 bloques de 6 min moderados.' },
      { dayOffset: 5, workoutType: 'salida_larga', intensity: 'suave', minutes: 142, loadKg: 0, note: 'Sabado 2:15-2:30 h.' },
      { dayOffset: 6, workoutType: 'suave', intensity: 'suave', minutes: 67, loadKg: 0, note: 'Domingo suave 60-75 min, fin de semana consecutivo.' },
    ],
    strengthDayOffsets: [0, 2],
  },
  4: {
    sessions: [
      { dayOffset: 1, workoutType: 'suave', intensity: 'suave', minutes: 60, loadKg: 0, note: 'Martes suave 60 min.' },
      { dayOffset: 3, workoutType: 'moderado', intensity: 'moderado', minutes: 82, loadKg: 0, note: '75-90 min con algunos tramos moderados.' },
      { dayOffset: 5, workoutType: 'salida_larga', intensity: 'moderado', minutes: 165, loadKg: 4, note: 'Sabado 2:30-3:00 h con equipaje.' },
      { dayOffset: 6, workoutType: 'suave', intensity: 'suave', minutes: 105, loadKg: 4, note: 'Domingo suave 1:30-2:00 h.' },
    ],
    strengthDayOffsets: [0],
    loadOverrideByWeek: { 13: 3, 14: 5, 15: 7, 16: 8 },
  },
};

// Meses 5-6: plantilla explicita por semana del plan (17-24).
export const SPECIAL_WEEKS: Record<number, { sessions: SessionTemplate[]; strengthDayOffsets: number[] }> = {
  17: {
    sessions: [
      { dayOffset: 1, workoutType: 'recuperacion', intensity: 'muy_suave', minutes: 60, loadKg: 0, note: 'Martes recuperacion 60 min.' },
      { dayOffset: 3, workoutType: 'moderado', intensity: 'moderado', minutes: 90, loadKg: 0, note: 'Miercoles o jueves 90 min.' },
      { dayOffset: 4, workoutType: 'descanso', intensity: 'muy_suave', minutes: 0, loadKg: 0, note: 'Viernes descanso.' },
      { dayOffset: 5, workoutType: 'cargada', intensity: 'moderado', minutes: 180, loadKg: 8, note: 'Sabado 3 h cargada.' },
      { dayOffset: 6, workoutType: 'cargada', intensity: 'suave', minutes: 135, loadKg: 8, note: 'Domingo 2:00-2:30 h cargada.' },
    ],
    strengthDayOffsets: [0],
  },
  18: {
    sessions: [
      { dayOffset: 1, workoutType: 'recuperacion', intensity: 'muy_suave', minutes: 60, loadKg: 0, note: 'Martes recuperacion 60 min.' },
      { dayOffset: 3, workoutType: 'moderado', intensity: 'moderado', minutes: 90, loadKg: 0, note: 'Miercoles o jueves 90 min.' },
      { dayOffset: 4, workoutType: 'descanso', intensity: 'muy_suave', minutes: 0, loadKg: 0, note: 'Viernes descanso.' },
      { dayOffset: 5, workoutType: 'cargada', intensity: 'moderado', minutes: 180, loadKg: 8, note: 'Sabado 3 h cargada.' },
      { dayOffset: 6, workoutType: 'cargada', intensity: 'suave', minutes: 150, loadKg: 8, note: 'Domingo 2:30 h cargada.' },
    ],
    strengthDayOffsets: [0],
  },
  19: {
    sessions: [
      { dayOffset: 1, workoutType: 'recuperacion', intensity: 'muy_suave', minutes: 60, loadKg: 0, note: 'Martes recuperacion 60 min.' },
      { dayOffset: 3, workoutType: 'moderado', intensity: 'moderado', minutes: 90, loadKg: 0, note: 'Miercoles o jueves 90 min.' },
      { dayOffset: 4, workoutType: 'descanso', intensity: 'muy_suave', minutes: 0, loadKg: 0, note: 'Viernes descanso.' },
      { dayOffset: 5, workoutType: 'cargada', intensity: 'moderado', minutes: 180, loadKg: 8, note: 'Sabado 3 h cargada.' },
      { dayOffset: 6, workoutType: 'cargada', intensity: 'suave', minutes: 150, loadKg: 8, note: 'Domingo 2:30 h cargada.' },
    ],
    strengthDayOffsets: [0],
  },
  20: {
    // Bloque especial de tres dias: viernes 2 h, sabado 3 h, domingo 2:30-3 h.
    sessions: [
      { dayOffset: 1, workoutType: 'recuperacion', intensity: 'muy_suave', minutes: 60, loadKg: 0, note: 'Martes recuperacion 60 min.' },
      { dayOffset: 3, workoutType: 'suave', intensity: 'suave', minutes: 75, loadKg: 0, note: 'Jueves suave antes del bloque.' },
      { dayOffset: 4, workoutType: 'cargada', intensity: 'suave', minutes: 120, loadKg: 8, note: 'Bloque especial: viernes 2 h cargada.' },
      { dayOffset: 5, workoutType: 'cargada', intensity: 'moderado', minutes: 180, loadKg: 8, note: 'Bloque especial: sabado 3 h cargada.' },
      { dayOffset: 6, workoutType: 'cargada', intensity: 'suave', minutes: 165, loadKg: 8, note: 'Bloque especial: domingo 2:30-3:00 h cargada.' },
    ],
    strengthDayOffsets: [],
  },
  21: {
    // Mes 6, semana 1: cuatro salidas, unas 7 h, fin de semana 3 h + 2 h.
    sessions: [
      { dayOffset: 1, workoutType: 'suave', intensity: 'suave', minutes: 60, loadKg: 0, note: 'Martes suave 60 min.' },
      { dayOffset: 3, workoutType: 'suave', intensity: 'suave', minutes: 75, loadKg: 4, note: 'Jueves suave 75 min.' },
      { dayOffset: 5, workoutType: 'cargada', intensity: 'moderado', minutes: 180, loadKg: 8, note: 'Sabado 3 h cargada.' },
      { dayOffset: 6, workoutType: 'cargada', intensity: 'suave', minutes: 120, loadKg: 8, note: 'Domingo 2 h cargada.' },
    ],
    strengthDayOffsets: [0],
  },
  22: {
    // Mes 6, semana 2: simulacion de cuatro dias consecutivos con equipaje definitivo.
    sessions: [
      { dayOffset: 3, workoutType: 'simulacion', intensity: 'suave', minutes: 150, loadKg: 9, note: 'Simulacion dia 1: 2:30 h suave.' },
      { dayOffset: 4, workoutType: 'simulacion', intensity: 'suave', minutes: 180, loadKg: 9, note: 'Simulacion dia 2: 3 h suave.' },
      { dayOffset: 5, workoutType: 'simulacion', intensity: 'suave', minutes: 180, loadKg: 9, note: 'Simulacion dia 3: 3 h suave.' },
      { dayOffset: 6, workoutType: 'simulacion', intensity: 'muy_suave', minutes: 120, loadKg: 9, note: 'Simulacion dia 4: 2 h suaves.' },
    ],
    strengthDayOffsets: [],
  },
  23: {
    // Mes 6, semana 3: reduccion del 40%, 4-5 h en 3-4 salidas faciles.
    sessions: [
      { dayOffset: 1, workoutType: 'suave', intensity: 'muy_suave', minutes: 60, loadKg: 0, note: 'Salida facil 1.' },
      { dayOffset: 3, workoutType: 'suave', intensity: 'muy_suave', minutes: 75, loadKg: 0, note: 'Salida facil 2.' },
      { dayOffset: 5, workoutType: 'suave', intensity: 'suave', minutes: 90, loadKg: 4, note: 'Salida facil 3, carga ligera.' },
      { dayOffset: 6, workoutType: 'recuperacion', intensity: 'muy_suave', minutes: 45, loadKg: 0, note: 'Salida facil 4, muy suave.' },
    ],
    strengthDayOffsets: [],
  },
  24: {
    // Mes 6, semana 4: 2-3 salidas de 45-60 min y dos dias de descanso antes del viaje.
    sessions: [
      { dayOffset: 0, workoutType: 'suave', intensity: 'muy_suave', minutes: 50, loadKg: 0, note: 'Salida corta de piernas.' },
      { dayOffset: 2, workoutType: 'suave', intensity: 'muy_suave', minutes: 55, loadKg: 0, note: 'Salida corta de piernas.' },
      { dayOffset: 4, workoutType: 'suave', intensity: 'muy_suave', minutes: 45, loadKg: 0, note: 'Ultima salida antes del viaje.' },
      { dayOffset: 5, workoutType: 'descanso', intensity: 'muy_suave', minutes: 0, loadKg: 0, note: 'Descanso antes del viaje.' },
      { dayOffset: 6, workoutType: 'descanso', intensity: 'muy_suave', minutes: 0, loadKg: 0, note: 'Descanso antes del viaje.' },
    ],
    strengthDayOffsets: [],
  },
};

export const STRENGTH_MINUTES = 22;
export const TOTAL_PLAN_WEEKS = 24;
