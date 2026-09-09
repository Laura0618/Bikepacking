// Validacion de payloads en el backend. Sin dependencias.
// No confia en el cliente: comprueba forma, tipos y limites de tamano.

export interface ValidRow {
  id: string;
  updatedAt: string;
  deletedAt: string | null;
  /** Fila completa tal cual, ya validada en forma minima. */
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

const MAX_ROWS = 5000;
const MAX_JSON_BYTES = 20_000;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isIsoDateTime(v: unknown): v is string {
  return typeof v === 'string' && ISO_RE.test(v) && !Number.isNaN(Date.parse(v));
}

function jsonSizeOk(v: unknown): boolean {
  return JSON.stringify(v).length <= MAX_JSON_BYTES;
}

function parseRow(value: unknown): ValidRow | null {
  if (!isObject(value)) return null;
  if (typeof value.id !== 'string' || value.id.length === 0 || value.id.length > 200) return null;
  if (!isIsoDateTime(value.updatedAt)) return null;
  const deletedAt =
    value.deletedAt === null || value.deletedAt === undefined
      ? null
      : isIsoDateTime(value.deletedAt)
        ? value.deletedAt
        : undefined;
  if (deletedAt === undefined) return null;
  if (!jsonSizeOk(value)) return null;
  return { id: value.id, updatedAt: value.updatedAt, deletedAt, raw: value };
}

function parseRows(value: unknown): ValidRow[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length > MAX_ROWS) return null;
  const out: ValidRow[] = [];
  for (const item of value) {
    const row = parseRow(item);
    if (!row) return null;
    out.push(row);
  }
  return out;
}

function parseSettings(value: unknown): ValidSettings | null | undefined {
  if (value === null || value === undefined) return null;
  if (!isObject(value)) return undefined;
  if (typeof value.startDate !== 'string' || typeof value.tripDate !== 'string') return undefined;
  if (!Array.isArray(value.preferredTrainingDays)) return undefined;
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

/** Devuelve el push validado o `null` si el cuerpo es invalido. */
export function parseSyncPush(body: Record<string, unknown>): ValidPush | null {
  const settings = parseSettings(body.settings);
  if (settings === undefined) return null;
  const workouts = parseRows(body.workouts ?? []);
  const strengthSessions = parseRows(body.strengthSessions ?? []);
  const milestones = parseRows(body.milestones ?? []);
  const tombstones = parseTombstones(body.tombstones ?? []);
  if (!workouts || !strengthSessions || !milestones || !tombstones) return null;
  return { settings, workouts, strengthSessions, milestones, tombstones };
}
