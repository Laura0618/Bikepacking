-- Pedalea a Polonia - esquema inicial de persistencia (Cloudflare D1 / SQLite).
--
-- Diseno:
--  * Cada fila pertenece a un usuario (user_id). PK compuesta (user_id, id).
--  * El objeto completo de la entidad se guarda como JSON en `data`, y ademas
--    se materializan `updated_at` y `deleted_at` como columnas reales para
--    resolver conflictos (gana el mas reciente) e indexar consultas de sync.
--    Motivo: los tipos TypeScript del cliente evolucionan; guardando JSON no
--    hace falta una migracion por cada campo nuevo. Las consultas de esta fase
--    son siempre "por usuario" y "por updated_at", que si van indexadas.
--  * Fechas en texto ISO 8601 UTC.

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,           -- Google `sub`
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL DEFAULT '',
  picture     TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id                 TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  start_date              TEXT NOT NULL,
  trip_date               TEXT NOT NULL,
  preferred_training_days TEXT NOT NULL,   -- JSON array de enteros 0-6
  units                   TEXT NOT NULL,   -- 'metric' | 'imperial'
  data                    TEXT NOT NULL,   -- JSON completo de UserSettings
  updated_at              TEXT NOT NULL,
  deleted_at              TEXT,
  created_at              TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workouts (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id          TEXT NOT NULL,
  data        TEXT NOT NULL,               -- JSON completo del Workout
  updated_at  TEXT NOT NULL,
  deleted_at  TEXT,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_workouts_user_updated ON workouts (user_id, updated_at);

CREATE TABLE IF NOT EXISTS strength_sessions (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id          TEXT NOT NULL,
  data        TEXT NOT NULL,               -- JSON completo de StrengthSession
  updated_at  TEXT NOT NULL,
  deleted_at  TEXT,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_strength_user_updated ON strength_sessions (user_id, updated_at);

CREATE TABLE IF NOT EXISTS milestones (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id          TEXT NOT NULL,               -- MilestoneId
  data        TEXT NOT NULL,               -- JSON completo de Milestone
  updated_at  TEXT NOT NULL,
  deleted_at  TEXT,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_milestones_user_updated ON milestones (user_id, updated_at);

CREATE TABLE IF NOT EXISTS sync_metadata (
  user_id       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_sync_at  TEXT,
  updated_at    TEXT NOT NULL
);
