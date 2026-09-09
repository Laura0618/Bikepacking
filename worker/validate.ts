// Validacion de payloads en el backend. Sin dependencias.
// No confia en el cliente: comprueba forma, tipos, enums de dominio y limites.
// Devuelve `{ ok: false, error }` con un mensaje 400 claro cuando algo no cuadra.

import {
  isIntensity,
  isMilestoneId,
  isWorkoutStatus,
  isWorkoutType,
} from '../src/lib/domain';

export interface ValidRow {
  id: string;
  updatedAt: string;
  deletedAt: string | null;
  /** Fila completa tal cual, ya validada. */
  raw: Record<string, unknown>;
}

export interface ValidSettings {
  updatedAt: string;
  deletedAt: string | null;
  raw: Record<string, unknown>;
}

export interface ValidTombstone {
  entity: 'workout' | 'strengthSession';
  id: string;
  deletedAt: string;
}

export interface ValidPush {
  settings: ValidSettings | null;
  workouts: ValidRow[];
  strengthSessions: ValidRow[];
  milestones: ValidRow[];
  tombstones: ValidTombstone[];
}

export type PushParse = { ok: true; value: ValidPush } | { ok: false; error: string };

const MAX_ROWS = 5000;
const MAX_JSON_BYTES = 20_000;
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isIsoDateTime(v: unknown): v is string {
  return typeof v === 'string' && ISO_DATETIME_RE.test(v) && !Number.isNaN(Date.parse(v));
}
function isIsoDate(v: unknown): v is string {
  return typeof v === 'string' && ISO_DATE_RE.test(v) && !Number.isNaN(Date.parse(v));
}
function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
function inRange(v: unknown, min: number, max: number): boolean {
  return isFiniteNumber(v) && v >= min && v <= max;
}
function jsonSizeOk(v: unknown): boolean {
  return JSON.stringify(v).length <= MAX_JSON_BYTES;
}

/** Campos comunes a toda fila sincronizable. */
function baseRow(value: unknown): { id: string; updatedAt: string; deletedAt: string | null } | null {
  if (!isObject(value)) return null;
  if (typeof value.id !== 'string' || value.id.length === 0 || value.id.length > 200) return null;
  if (!isIsoDateTime(value.updatedAt)) return null;
  let deletedAt: string | null;
  if (value.deletedAt === null || value.deletedAt === undefined) deletedAt = null;
  else if (isIsoDateTime(value.deletedAt)) deletedAt = value.deletedAt;
  else return null;
  if (!jsonSizeOk(value)) return null;
  return { id: value.id, updatedAt: value.updatedAt, deletedAt };
}

function parseWorkoutRow(value: unknown): ValidRow | null {
  const base = baseRow(value);
  if (!base || !isObject(value)) return null;
  if (!isIsoDate(value.date)) return null;
  if (!isWorkoutType(value.workoutType)) return null;
  if (!isIntensity(value.intensity)) return null;
  if (!isWorkoutStatus(value.status)) return null;
  if (!inRange(value.plannedDurationMinutes, 0, 24 * 60)) return null;
  if (
    value.actualDurationMinutes !== null &&
    !inRange(value.actualDurationMinutes, 0, 24 * 60)
  ) {
    return null;
  }
  if (!inRange(value.loadKg, 0, 100)) return null;
  if (typeof value.notes !== 'string') return null;
  if (typeof value.fromPlan !== 'boolean') return null;
  if (value.distanceKm !== undefined && !inRange(value.distanceKm, 0, 2000)) return null;
  if (value.effortRpe !== undefined && !inRange(value.effortRpe, 1, 10)) return null;
  if (value.painLevel !== undefined && !inRange(value.painLevel, 0, 10)) return null;
  return { ...base, raw: value };
}

function parseStrengthRow(value: unknown): ValidRow | null {
  const base = baseRow(value);
  if (!base || !isObject(value)) return null;
  if (!isIsoDate(value.date)) return null;
  if (!isWorkoutStatus(value.status)) return null;
  if (typeof value.notes !== 'string') return null;
  if (typeof value.fromPlan !== 'boolean') return null;
  if (
    !Array.isArray(value.exercises) ||
    value.exercises.some((e) => typeof e !== 'string' || e.length > 60)
  ) {
    return null;
  }
  return { ...base, raw: value };
}

function parseMilestoneRow(value: unknown): ValidRow | null {
  const base = baseRow(value);
  if (!base || !isObject(value)) return null;
  if (!isMilestoneId(value.id)) return null;
  if (typeof value.label !== 'string' || typeof value.condition !== 'string') return null;
  if (value.achievedAt !== null && !isIsoDateTime(value.achievedAt)) return null;
  return { ...base, raw: value };
}

function parseRows(
  value: unknown,
  parseOne: (v: unknown) => ValidRow | null,
): ValidRow[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length > MAX_ROWS) return null;
  const out: ValidRow[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const row = parseOne(item);
    if (!row || seen.has(row.id)) return null;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

function parseSettings(value: unknown): ValidSettings | null | undefined {
  if (value === null || value === undefined) return null;
  if (!isObject(value)) return undefined;
  if (typeof value.startDate !== 'string' || typeof value.tripDate !== 'string') return undefined;
  if (
    !Array.isArray(value.preferredTrainingDays) ||
    value.preferredTrainingDays.some((d) => !Number.isInteger(d) || (d as number) < 0 || (d as number) > 6)
  ) {
    return undefined;
  }
  if (value.units !== 'metric' && value.units !== 'imperial') return undefined;
  if (!isIsoDateTime(value.updatedAt)) return undefined;
  if (!jsonSizeOk(value)) return undefined;
  return { updatedAt: value.updatedAt, deletedAt: null, raw: value };
}

function parseTombstones(value: unknown): ValidTombstone[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length > MAX_ROWS) return null;
  const out: ValidTombstone[] = [];
  for (const item of value) {
    if (!isObject(item)) return null;
    if (item.entity !== 'workout' && item.entity !== 'strengthSession') return null;
    if (typeof item.id !== 'string' || item.id.length === 0 || item.id.length > 200) return null;
    if (!isIsoDateTime(item.deletedAt)) return null;
    out.push({ entity: item.entity, id: item.id, deletedAt: item.deletedAt });
  }
  return out;
}

/** Valida el cuerpo del POST /api/sync. */
export function parseSyncPush(body: Record<string, unknown>): PushParse {
  const settings = parseSettings(body.settings);
  if (settings === undefined) return { ok: false, error: 'Ajustes con formato invalido.' };

  const workouts = parseRows(body.workouts ?? [], parseWorkoutRow);
  if (!workouts) return { ok: false, error: 'Lista de entrenamientos invalida.' };

  const strengthSessions = parseRows(body.strengthSessions ?? [], parseStrengthRow);
  if (!strengthSessions) return { ok: false, error: 'Lista de sesiones de fuerza invalida.' };

  const milestones = parseRows(body.milestones ?? [], parseMilestoneRow);
  if (!milestones) return { ok: false, error: 'Lista de hitos invalida.' };

  const tombstones = parseTombstones(body.tombstones ?? []);
  if (!tombstones) return { ok: false, error: 'Lista de borrados invalida.' };

  return { ok: true, value: { settings, workouts, strengthSessions, milestones, tombstones } };
}
