// Acceso a D1. Todas las consultas van parametrizadas y filtradas por user_id.

import type {
  AuthUser,
  Milestone,
  StrengthSession,
  SyncSnapshot,
  UserSettings,
  Workout,
} from '../src/types';
import type { Env } from './env';
import type { GoogleProfile } from './google';
import type { ValidPush, ValidRow } from './validate';

type RowTable = 'workouts' | 'strength_sessions' | 'milestones';

interface StoredRow {
  id: string;
  data: string;
  updated_at: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

// --- Usuarios --------------------------------------------------------------

export async function upsertUser(env: Env, p: GoogleProfile): Promise<AuthUser> {
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO users (id, email, name, picture, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?5)
     ON CONFLICT(id) DO UPDATE SET email = ?2, name = ?3, picture = ?4, updated_at = ?5`,
  )
    .bind(p.sub, p.email, p.name, p.picture, now)
    .run();
  return { id: p.sub, email: p.email, name: p.name, picture: p.picture };
}

export async function getUser(env: Env, uid: string): Promise<AuthUser | null> {
  const row = await env.DB.prepare(
    `SELECT id, email, name, picture FROM users WHERE id = ?1`,
  )
    .bind(uid)
    .first<{ id: string; email: string; name: string; picture: string | null }>();
  return row ? { id: row.id, email: row.email, name: row.name, picture: row.picture } : null;
}

// --- Sincronizacion ------------------------------------------------------

export async function getLastSync(env: Env, uid: string): Promise<string | null> {
  const row = await env.DB.prepare(
    `SELECT last_sync_at FROM sync_metadata WHERE user_id = ?1`,
  )
    .bind(uid)
    .first<{ last_sync_at: string | null }>();
  return row?.last_sync_at ?? null;
}

export async function setLastSync(env: Env, uid: string, iso: string): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO sync_metadata (user_id, last_sync_at, updated_at)
     VALUES (?1, ?2, ?2)
     ON CONFLICT(user_id) DO UPDATE SET last_sync_at = ?2, updated_at = ?2`,
  )
    .bind(uid, iso)
    .run();
}

function parseJsonRow<T>(row: StoredRow): T {
  return JSON.parse(row.data) as T;
}

export async function getSnapshot(env: Env, uid: string): Promise<SyncSnapshot> {
  const [settingsRow, workoutRows, strengthRows, milestoneRows] = await Promise.all([
    env.DB.prepare(`SELECT data FROM user_settings WHERE user_id = ?1`)
      .bind(uid)
      .first<{ data: string }>(),
    env.DB.prepare(`SELECT id, data, updated_at FROM workouts WHERE user_id = ?1`)
      .bind(uid)
      .all<StoredRow>(),
    env.DB.prepare(`SELECT id, data, updated_at FROM strength_sessions WHERE user_id = ?1`)
      .bind(uid)
      .all<StoredRow>(),
    env.DB.prepare(`SELECT id, data, updated_at FROM milestones WHERE user_id = ?1`)
      .bind(uid)
      .all<StoredRow>(),
  ]);

  return {
    settings: settingsRow ? (JSON.parse(settingsRow.data) as UserSettings) : null,
    workouts: (workoutRows.results ?? []).map((r) => parseJsonRow<Workout>(r)),
    strengthSessions: (strengthRows.results ?? []).map((r) => parseJsonRow<StrengthSession>(r)),
    milestones: (milestoneRows.results ?? []).map((r) => parseJsonRow<Milestone>(r)),
  };
}

async function existingUpdatedAt(
  env: Env,
  table: RowTable,
  uid: string,
): Promise<Map<string, string>> {
  const rows = await env.DB.prepare(
    `SELECT id, updated_at FROM ${table} WHERE user_id = ?1`,
  )
    .bind(uid)
    .all<{ id: string; updated_at: string }>();
  const map = new Map<string, string>();
  for (const row of rows.results ?? []) map.set(row.id, row.updated_at);
  return map;
}

/** Politica de resolucion de conflictos. Aislada para poder cambiarla despues. */
export function incomingWins(incomingUpdatedAt: string, existingUpdatedAt: string | undefined): boolean {
  if (existingUpdatedAt === undefined) return true;
  return Date.parse(incomingUpdatedAt) > Date.parse(existingUpdatedAt);
}

interface PushResult {
  conflicts: { entity: string; id: string }[];
  applied: number;
}

export async function applyPush(env: Env, uid: string, push: ValidPush): Promise<PushResult> {
  const now = nowIso();
  const conflicts: { entity: string; id: string }[] = [];
  const statements: D1PreparedStatement[] = [];

  const queueRows = async (
    entity: 'workout' | 'strengthSession' | 'milestone',
    table: RowTable,
    rows: ValidRow[],
  ): Promise<void> => {
    if (rows.length === 0) return;
    const existing = await existingUpdatedAt(env, table, uid);
    for (const row of rows) {
      if (!incomingWins(row.updatedAt, existing.get(row.id))) {
        conflicts.push({ entity, id: row.id });
        continue;
      }
      statements.push(
        env.DB.prepare(
          `INSERT INTO ${table} (user_id, id, data, updated_at, deleted_at, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)
           ON CONFLICT(user_id, id) DO UPDATE SET data = ?3, updated_at = ?4, deleted_at = ?5`,
        ).bind(uid, row.id, JSON.stringify(row.raw), row.updatedAt, row.deletedAt, now),
      );
    }
  };

  await queueRows('workout', 'workouts', push.workouts);
  await queueRows('strengthSession', 'strength_sessions', push.strengthSessions);
  await queueRows('milestone', 'milestones', push.milestones);

  if (push.settings) {
    const current = await env.DB.prepare(
      `SELECT updated_at FROM user_settings WHERE user_id = ?1`,
    )
      .bind(uid)
      .first<{ updated_at: string }>();
    if (incomingWins(push.settings.updatedAt, current?.updated_at)) {
      const s = push.settings.raw as unknown as UserSettings;
      statements.push(
        env.DB.prepare(
          `INSERT INTO user_settings
             (user_id, start_date, trip_date, preferred_training_days, units, data, updated_at, deleted_at, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, NULL, ?8)
           ON CONFLICT(user_id) DO UPDATE SET
             start_date = ?2, trip_date = ?3, preferred_training_days = ?4,
             units = ?5, data = ?6, updated_at = ?7`,
        ).bind(
          uid,
          s.startDate,
          s.tripDate,
          JSON.stringify(s.preferredTrainingDays),
          s.units,
          JSON.stringify(s),
          push.settings.updatedAt,
          now,
        ),
      );
    } else {
      conflicts.push({ entity: 'settings', id: 'settings' });
    }
  }

  if (statements.length > 0) await env.DB.batch(statements);
  return { conflicts, applied: statements.length };
}
