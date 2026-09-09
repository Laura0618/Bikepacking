// Persistencia en localStorage y (de)serializacion de los datos de la app.

import type { AppData, UserSettings, Workout } from '../types';
import { addDays, todayISO } from './dates';
import { initialMilestones, reconcileMilestones } from './milestones';
import { generatePlan } from './plan';

export const STORAGE_KEY = 'pedalea-a-polonia:v1';
export const DATA_VERSION = 1;

export function defaultSettings(startDate: string = todayISO()): UserSettings {
  return {
    startDate,
    tripDate: addDays(startDate, 7 * 26), // ~6 meses
    preferredTrainingDays: [2, 4, 6], // martes, jueves, sabado
    units: 'metric',
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
    planGeneratedAt: new Date().toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Valida de forma tolerante un objeto y lo normaliza a AppData; lanza si es irrecuperable. */
export function parseAppData(raw: unknown): AppData {
  if (!isRecord(raw)) throw new Error('El archivo no tiene el formato esperado.');
  const settings = raw.settings;
  if (!isRecord(settings) || typeof settings.startDate !== 'string') {
    throw new Error('Faltan los ajustes (startDate).');
  }
  const workouts = Array.isArray(raw.workouts) ? (raw.workouts as Workout[]) : [];
  const strengthSessions = Array.isArray(raw.strengthSessions)
    ? (raw.strengthSessions as AppData['strengthSessions'])
    : [];

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
  };

  const base: AppData = {
    version: DATA_VERSION,
    settings: normalizedSettings,
    workouts,
    strengthSessions,
    milestones:
      Array.isArray(raw.milestones) && raw.milestones.length > 0
        ? (raw.milestones as AppData['milestones'])
        : initialMilestones(),
    planGeneratedAt:
      typeof raw.planGeneratedAt === 'string' ? raw.planGeneratedAt : new Date().toISOString(),
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
