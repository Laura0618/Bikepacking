// Tipos estrictos del dominio de "Pedalea a Polonia".
// Toda la app trabaja con fechas en formato ISO "YYYY-MM-DD".

export type Units = 'metric' | 'imperial';

export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo ... 6 = sabado

export interface UserSettings {
  /** Fecha de inicio del plan (ISO YYYY-MM-DD). */
  startDate: string;
  /** Fecha objetivo del viaje (ISO YYYY-MM-DD). */
  tripDate: string;
  /** Dias de la semana preferidos para entrenar. */
  preferredTrainingDays: WeekdayIndex[];
  /** Sistema de unidades para distancia. La duracion siempre es la metrica principal. */
  units: Units;
}

export type WorkoutType =
  | 'suave'
  | 'moderado'
  | 'salida_larga'
  | 'recuperacion'
  | 'cargada'
  | 'simulacion'
  | 'descanso';

export type Intensity = 'muy_suave' | 'suave' | 'moderado' | 'exigente';

export type WorkoutStatus = 'planned' | 'completed' | 'partial' | 'skipped';

export interface Workout {
  id: string;
  /** Fecha del entrenamiento (ISO YYYY-MM-DD). */
  date: string;
  plannedDurationMinutes: number;
  actualDurationMinutes: number | null;
  workoutType: WorkoutType;
  intensity: Intensity;
  /** Peso del equipaje transportado en kg (0 si va sin carga). */
  loadKg: number;
  /** Distancia opcional; metrica secundaria. */
  distanceKm?: number;
  /** Esfuerzo percibido 1-10 opcional. */
  effortRpe?: number;
  /** Nivel de dolor 0-10 opcional. */
  painLevel?: number;
  notes: string;
  status: WorkoutStatus;
  /** true cuando el entrenamiento proviene del plan precargado. */
  fromPlan: boolean;
  /** Mes del plan (1-6) al que pertenece, si aplica. */
  planMonth?: number;
  /** Semana del plan (1-26) a la que pertenece, si aplica. */
  planWeek?: number;
}

export interface PlanMonth {
  monthNumber: number;
  weeklyHoursMin: number;
  weeklyHoursMax: number;
  longestRideMinutes: number;
  focus: string;
  /** Ids de los workouts generados para este mes. */
  workouts: string[];
}

export type StrengthExerciseId =
  | 'sentadilla'
  | 'zancada'
  | 'peso_muerto_rumano'
  | 'puente_gluteo'
  | 'plancha'
  | 'plancha_lateral'
  | 'remo_banda'
  | 'elevacion_talones'
  | 'perro_pajaro'
  | 'gato_camello';

export interface StrengthExercise {
  id: StrengthExerciseId;
  nombre: string;
  series: number;
  repeticiones: string;
  foco: string;
  descripcion: string;
}

export interface StrengthSession {
  id: string;
  date: string;
  exercises: StrengthExerciseId[];
  status: WorkoutStatus;
  notes: string;
  fromPlan: boolean;
  planWeek?: number;
}

export type MilestoneId =
  | 'noventa_min'
  | 'dos_horas'
  | 'finde_consecutivo'
  | 'tres_horas_cargada'
  | 'bloque_tres_dias'
  | 'simulacion_cuatro_dias';

export interface Milestone {
  id: MilestoneId;
  label: string;
  /** Descripcion legible de la condicion que lo desbloquea. */
  condition: string;
  /** Fecha ISO en la que se logro, o null si sigue pendiente. */
  achievedAt: string | null;
}

export interface AppData {
  version: number;
  settings: UserSettings;
  workouts: Workout[];
  strengthSessions: StrengthSession[];
  milestones: Milestone[];
  /** Marca de tiempo ISO de la ultima generacion del plan. */
  planGeneratedAt: string | null;
}

export type AlertLevel = 'recuperacion' | 'alerta' | 'peligro';

export interface AppAlert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
}

export interface WeeklyHoursPoint {
  /** Lunes de la semana (ISO YYYY-MM-DD). */
  weekStart: string;
  /** Etiqueta corta para el eje. */
  label: string;
  plannedHours: number;
  actualHours: number;
  isDeload: boolean;
}

export interface LongestRidePoint {
  weekStart: string;
  label: string;
  minutes: number;
}

export interface LoadPoint {
  weekStart: string;
  label: string;
  maxLoadKg: number;
}

export interface ConsecutiveDaysPoint {
  weekStart: string;
  label: string;
  streak: number;
}
