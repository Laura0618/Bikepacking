// Motor de sincronizacion: logica pura y testeable.
//
// Politica de conflictos: "gana el mas reciente" por `updatedAt` (LWW).
// `resolveRow` esta aislada para poder cambiar la politica mas adelante
// (p. ej. merge por campos o CRDT) sin tocar el resto.

import type {
  AppData,
  Milestone,
  StrengthSession,
  SyncPullResponse,
  SyncPushRequest,
  SyncSnapshot,
  Tombstone,
  UserSettings,
  Workout,
} from '../types';

export interface LocalSnapshot {
  settings: UserSettings;
  workouts: Workout[];
  strengthSessions: StrengthSession[];
  milestones: Milestone[];
  tombstones: Tombstone[];
}

export interface MergeOptions {
  /** Migracion inicial: fuerza subir todas las filas locales aunque no sean mas nuevas. */
  forceLocalDirty?: boolean;
}

export interface MergeResult {
  merged: LocalSnapshot;
  push: SyncPushRequest;
  /** true si el merge cambio algo respecto al estado local. */
  changed: boolean;
}

type Row = { id: string; updatedAt: string; deletedAt?: string | null };

/** true si `a` debe prevalecer sobre `b` (o si `b` no existe). */
export function resolveRow(a: Row, b: Row | undefined): boolean {
  if (!b) return true;
  return Date.parse(a.updatedAt) > Date.parse(b.updatedAt);
}

function byId<T extends Row>(rows: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const r of rows) map.set(r.id, r);
  return map;
}

function tombstoneKey(t: { entity: string; id: string }): string {
  return `${t.entity}:${t.id}`;
}

const TOMBSTONE_TTL_MS = 45 * 86_400_000;

function mergeTombstones(local: Tombstone[], remote: Tombstone[]): Tombstone[] {
  const cutoff = Date.now() - TOMBSTONE_TTL_MS;
  const map = new Map<string, Tombstone>();
  for (const t of [...local, ...remote]) {
    if (Date.parse(t.deletedAt) < cutoff) continue;
    const existing = map.get(tombstoneKey(t));
    if (!existing || Date.parse(t.deletedAt) > Date.parse(existing.deletedAt)) {
      map.set(tombstoneKey(t), t);
    }
  }
  return [...map.values()];
}

interface ListMergeResult<T> {
  merged: T[];
  toPush: T[];
  changed: boolean;
}

function mergeList<T extends Row>(
  entity: 'workout' | 'strengthSession' | 'milestone',
  local: T[],
  remote: T[],
  deletedByKey: Map<string, string>, // key -> deletedAt, de tombstones remotas
  localTombstones: Tombstone[],
  opts: MergeOptions,
): ListMergeResult<T> {
  const localMap = byId(local);
  const remoteMap = byId(remote);
  const localTombKeys = new Set(localTombstones.map(tombstoneKey));
  const ids = new Set<string>([...localMap.keys(), ...remoteMap.keys()]);

  const merged: T[] = [];
  const toPush: T[] = [];
  let changed = false;

  for (const id of ids) {
    const l = localMap.get(id);
    const r = remoteMap.get(id);
    const remoteDeletedAt = deletedByKey.get(`${entity}:${id}`);

    if (l && r) {
      const localWins = resolveRow(l, r);
      merged.push(localWins ? l : r);
      if (localWins) {
        if (opts.forceLocalDirty || Date.parse(l.updatedAt) > Date.parse(r.updatedAt)) toPush.push(l);
      } else {
        changed = true;
      }
      continue;
    }

    if (l && !r) {
      if (remoteDeletedAt && Date.parse(remoteDeletedAt) >= Date.parse(l.updatedAt)) {
        // Borrado en otro dispositivo y nuestra copia no es mas nueva: quitar.
        changed = true;
        continue;
      }
      merged.push(l);
      toPush.push(l); // fila solo local: la cuenta debe recibirla
      continue;
    }

    if (!l && r) {
      if (localTombKeys.has(`${entity}:${id}`)) {
        // La borramos aqui; no la readmitimos, se propaga la tumba.
        changed = true;
        continue;
      }
      merged.push(r);
      changed = true;
      continue;
    }
  }

  return { merged, toPush, changed };
}

export function isRemoteEmpty(remote: SyncSnapshot): boolean {
  return (
    remote.settings === null &&
    remote.workouts.length === 0 &&
    remote.strengthSessions.length === 0 &&
    remote.milestones.length === 0 &&
    remote.tombstones.length === 0
  );
}

export function mergeSnapshot(
  local: LocalSnapshot,
  remote: SyncPullResponse,
  opts: MergeOptions = {},
): MergeResult {
  const deletedByKey = new Map<string, string>();
  for (const t of remote.tombstones) deletedByKey.set(tombstoneKey(t), t.deletedAt);

  const wk = mergeList('workout', local.workouts, remote.workouts, deletedByKey, local.tombstones, opts);
  const st = mergeList(
    'strengthSession',
    local.strengthSessions,
    remote.strengthSessions,
    deletedByKey,
    local.tombstones,
    opts,
  );
  const ms = mergeList('milestone', local.milestones, remote.milestones, deletedByKey, [], opts);

  // Ajustes (singleton).
  let mergedSettings = local.settings;
  const settingsPush = { value: false };
  if (!remote.settings) {
    settingsPush.value = true;
  } else if (resolveRow({ id: 's', updatedAt: local.settings.updatedAt }, { id: 's', updatedAt: remote.settings.updatedAt })) {
    settingsPush.value = opts.forceLocalDirty || local.settings.updatedAt !== remote.settings.updatedAt;
  } else {
    mergedSettings = remote.settings;
  }

  const mergedTombstones = mergeTombstones(local.tombstones, remote.tombstones);

  const merged: LocalSnapshot = {
    settings: mergedSettings,
    workouts: wk.merged,
    strengthSessions: st.merged,
    milestones: ms.merged,
    tombstones: mergedTombstones,
  };

  const push: SyncPushRequest = {
    settings: settingsPush.value ? local.settings : null,
    workouts: wk.toPush,
    strengthSessions: st.toPush,
    milestones: ms.toPush,
    tombstones: local.tombstones,
  };

  const changed =
    wk.changed ||
    st.changed ||
    ms.changed ||
    mergedSettings !== local.settings ||
    mergedTombstones.length !== local.tombstones.length;

  return { merged, push, changed };
}

export function pushIsEmpty(push: SyncPushRequest): boolean {
  return (
    push.settings === null &&
    push.workouts.length === 0 &&
    push.strengthSessions.length === 0 &&
    push.milestones.length === 0 &&
    push.tombstones.length === 0
  );
}

/** Aplica un merge sobre AppData conservando los campos no sincronizados. */
export function applyMergeToAppData(data: AppData, merged: LocalSnapshot): AppData {
  return {
    ...data,
    settings: merged.settings,
    workouts: merged.workouts,
    strengthSessions: merged.strengthSessions,
    milestones: merged.milestones,
    tombstones: merged.tombstones,
  };
}

export function toLocalSnapshot(data: AppData): LocalSnapshot {
  return {
    settings: data.settings,
    workouts: data.workouts,
    strengthSessions: data.strengthSessions,
    milestones: data.milestones,
    tombstones: data.tombstones,
  };
}
