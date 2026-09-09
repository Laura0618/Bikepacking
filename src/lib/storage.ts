// Persistencia en localStorage y (de)serializacion de los datos de la app.

import type {
  AppData,
  Milestone,
  StrengthSession,
  Tombstone,
  UserSettings,
  Workout,
} from '../types';
import { addDays, nowISO, todayISO } from './dates';
import { initialMilestones, reconcileMilestones } from './milestones';
import { generatePlan } from './plan';

export const STORAGE_KEY = 'pedalea-a-polonia:v1';
/** v1: sin sincronizacion. v2: campos updatedAt/deletedAt + tombstones. */
export const DATA_VERSION = 2;

export function defaultSettings(startDate: string = todayISO()): UserSettings {
  return {
    startDate,
    tripDate: addDays(startDate, 7 * 26), // ~6 meses
    preferredTrainingDays: [2, 4, 6], // martes, jueves, sabado
    units: 'metric',
    updatedAt: nowISO(),
    deletedAt: null,
  };
}

/** Crea un estado inicial con el plan de seis meses precargado. */
export function createInitialData(startDate: string = todayISO()): AppData {
  const settings = defaultSettings(startDate);
  const plan = generatePlan(settings.startDate);
  return {
    version: DATA_VERSION,
    settings,
    workouts: plan.workouts,
    strengthSessions: plan.strengthSessions,
    milestones: initialMilestones(),
    planGeneratedAt: nowISO(),
    tombstones: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Anade updatedAt/deletedAt a filas que vengan de la version 1 (sin esos campos). */
function migrateRow<T extends { updatedAt?: unknown; deletedAt?: unknown }>(
  row: T,
  stamp: string,
): T & { updatedAt: string; deletedAt: string | null } {
  return {
    ...row,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : stamp,
    deletedAt: typeof row.deletedAt === 'string' ? row.deletedAt : null,
  };
}

function parseTombstones(raw: unknown): Tombstone[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (t): t is Tombstone =>
      isRecord(t) &&
      (t.entity === 'workout' || t.entity === 'strengthSession') &&
      typeof t.id === 'string' &&
      typeof t.deletedAt === 'string',
  );
}

/** Valida de forma tolerante un objeto y lo normaliza a AppData; lanza si es irrecuperable. */
export function parseAppData(raw: unknown): AppData {
  if (!isRecord(raw)) throw new Error('El archivo no tiene el formato esperado.');
  const settings = raw.settings;
  if (!isRecord(settings) || typeof settings.startDate !== 'string') {
    throw new Error('Faltan los ajustes (startDate).');
  }
  const stamp = nowISO();

  const workouts = (Array.isArray(raw.workouts) ? (raw.workouts as Workout[]) : []).map((w) =>
    migrateRow(w, stamp),
  );
  const strengthSessions = (
    Array.isArray(raw.strengthSessions) ? (raw.strengthSessions as StrengthSession[]) : []
  ).map((s) => migrateRow(s, stamp));

  const normalizedSettings: UserSettings = {
    startDate: settings.startDate,
    tripDate:
      typeof settings.tripDate === 'string'
        ? settings.tripDate
        : addDays(settings.startDate, 7 * 26),
    preferredTrainingDays: Array.isArray(settings.preferredTrainingDays)
      ? (settings.preferredTrainingDays.filter(
          (d): d is number => typeof d === 'number' && d >= 0 && d <= 6,
        ) as UserSettings['preferredTrainingDays'])
      : [2, 4, 6],
    units: settings.units === 'imperial' ? 'imperial' : 'metric',
    updatedAt: typeof settings.updatedAt === 'string' ? settings.updatedAt : stamp,
    deletedAt: typeof settings.deletedAt === 'string' ? settings.deletedAt : null,
  };

  const rawMilestones =
    Array.isArray(raw.milestones) && raw.milestones.length > 0
      ? (raw.milestones as Milestone[]).map((m) => migrateRow(m, stamp))
      : initialMilestones();

  const base: AppData = {
    version: DATA_VERSION,
    settings: normalizedSettings,
    workouts,
    strengthSessions,
    milestones: rawMilestones,
    planGeneratedAt:
      typeof raw.planGeneratedAt === 'string' ? raw.planGeneratedAt : nowISO(),
    tombstones: parseTombstones(raw.tombstones),
  };

  return { ...base, milestones: reconcileMilestones(base.milestones, base.workouts) };
}

export function loadAppData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseAppData(JSON.parse(raw));
  } catch (error) {
    console.warn('No se pudo leer el almacenamiento local:', error);
    return null;
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('No se pudo guardar en el almacenamiento local:', error);
  }
}

export function clearAppData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('No se pudo borrar el almacenamiento local:', error);
  }
}

export function exportToJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importFromJSON(text: string): AppData {
  const parsed: unknown = JSON.parse(text);
  return parseAppData(parsed);
}

/** true si el estado local contiene datos creados por la persona (no solo el plan precargado). */
export function hasUserData(data: AppData): boolean {
  const touchedWorkout = data.workouts.some(
    (w) => !w.fromPlan || w.status !== 'planned' || w.actualDurationMinutes !== null,
  );
  const touchedStrength = data.strengthSessions.some(
    (s) => !s.fromPlan || s.status !== 'planned',
  );
  const achievedMilestone = data.milestones.some((m) => m.achievedAt !== null);
  return touchedWorkout || touchedStrength || achievedMilestone;
}
