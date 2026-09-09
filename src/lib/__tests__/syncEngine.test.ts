import { describe, expect, it } from 'vitest';
import {
  isRemoteEmpty,
  mergeSnapshot,
  pushIsEmpty,
  resolveRow,
  type LocalSnapshot,
} from '../syncEngine';
import type { SyncPullResponse, UserSettings } from '../../types';
import { makeWorkout } from '../../test/factories';

function settings(updatedAt: string): UserSettings {
  return {
    startDate: '2026-01-05',
    tripDate: '2026-07-05',
    preferredTrainingDays: [2, 4, 6],
    units: 'metric',
    updatedAt,
    deletedAt: null,
  };
}

function local(over: Partial<LocalSnapshot> = {}): LocalSnapshot {
  return {
    settings: settings('2026-01-01T00:00:00.000Z'),
    workouts: [],
    strengthSessions: [],
    milestones: [],
    tombstones: [],
    ...over,
  };
}

function remote(over: Partial<SyncPullResponse> = {}): SyncPullResponse {
  return {
    settings: null,
    workouts: [],
    strengthSessions: [],
    milestones: [],
    tombstones: [],
    serverTime: '2026-02-01T00:00:00.000Z',
    lastSyncAt: null,
    ...over,
  };
}

describe('resolveRow (politica LWW)', () => {
  it('gana el updatedAt mas reciente', () => {
    const a = { id: 'x', updatedAt: '2026-02-02T00:00:00.000Z' };
    const b = { id: 'x', updatedAt: '2026-02-01T00:00:00.000Z' };
    expect(resolveRow(a, b)).toBe(true);
    expect(resolveRow(b, a)).toBe(false);
  });
  it('gana el local si no existe remoto', () => {
    expect(resolveRow({ id: 'x', updatedAt: '2026-01-01T00:00:00.000Z' }, undefined)).toBe(true);
  });
});

describe('isRemoteEmpty', () => {
  it('true cuando la cuenta no tiene nada', () => {
    expect(isRemoteEmpty(remote())).toBe(true);
  });
  it('false si hay workouts', () => {
    expect(isRemoteEmpty(remote({ workouts: [makeWorkout()] }))).toBe(false);
  });
});

describe('mergeSnapshot', () => {
  it('sube filas que solo existen en local', () => {
    const w = makeWorkout({ id: 'w1', updatedAt: '2026-01-10T00:00:00.000Z' });
    const { push, merged } = mergeSnapshot(local({ workouts: [w] }), remote());
    expect(push.workouts.map((x) => x.id)).toEqual(['w1']);
    expect(merged.workouts).toHaveLength(1);
  });

  it('adopta filas que solo existen en remoto', () => {
    const w = makeWorkout({ id: 'w2', updatedAt: '2026-01-10T00:00:00.000Z' });
    const { push, merged } = mergeSnapshot(local(), remote({ workouts: [w] }));
    expect(merged.workouts.map((x) => x.id)).toEqual(['w2']);
    expect(push.workouts).toHaveLength(0);
  });

  it('en conflicto gana el mas reciente y solo sube si el local es mas nuevo', () => {
    const localW = makeWorkout({ id: 'c', notes: 'local', updatedAt: '2026-03-02T00:00:00.000Z' });
    const remoteW = makeWorkout({ id: 'c', notes: 'remoto', updatedAt: '2026-03-01T00:00:00.000Z' });
    const res = mergeSnapshot(local({ workouts: [localW] }), remote({ workouts: [remoteW] }));
    expect(res.merged.workouts[0]?.notes).toBe('local');
    expect(res.push.workouts).toHaveLength(1);

    const res2 = mergeSnapshot(
      local({ workouts: [{ ...localW, updatedAt: '2026-02-28T00:00:00.000Z' }] }),
      remote({ workouts: [remoteW] }),
    );
    expect(res2.merged.workouts[0]?.notes).toBe('remoto');
    expect(res2.push.workouts).toHaveLength(0);
  });

  it('una tumba remota elimina la fila local si no es mas nueva', () => {
    const w = makeWorkout({ id: 'd1', updatedAt: '2026-01-10T00:00:00.000Z' });
    const res = mergeSnapshot(
      local({ workouts: [w] }),
      remote({ tombstones: [{ entity: 'workout', id: 'd1', deletedAt: '2026-01-20T00:00:00.000Z' }] }),
    );
    expect(res.merged.workouts).toHaveLength(0);
  });

  it('una tumba local impide readmitir la fila que llega del remoto', () => {
    const w = makeWorkout({ id: 'd2', updatedAt: '2026-01-05T00:00:00.000Z' });
    const res = mergeSnapshot(
      local({
        tombstones: [{ entity: 'workout', id: 'd2', deletedAt: '2026-01-10T00:00:00.000Z' }],
      }),
      remote({ workouts: [w] }),
    );
    expect(res.merged.workouts).toHaveLength(0);
    expect(res.push.tombstones.map((t) => t.id)).toEqual(['d2']);
  });

  it('migracion: forceLocalDirty sube todas las filas locales', () => {
    const w1 = makeWorkout({ id: 'm1', updatedAt: '2020-01-01T00:00:00.000Z' });
    const w2 = makeWorkout({ id: 'm2', updatedAt: '2020-01-02T00:00:00.000Z' });
    const { push } = mergeSnapshot(local({ workouts: [w1, w2] }), remote(), {
      forceLocalDirty: true,
    });
    expect(push.workouts).toHaveLength(2);
    expect(push.settings).not.toBeNull();
  });

  it('ajustes: gana el updatedAt mas reciente', () => {
    const res = mergeSnapshot(
      local({ settings: settings('2026-05-01T00:00:00.000Z') }),
      remote({ settings: settings('2026-04-01T00:00:00.000Z') }),
    );
    expect(res.merged.settings.updatedAt).toBe('2026-05-01T00:00:00.000Z');
    expect(res.push.settings?.updatedAt).toBe('2026-05-01T00:00:00.000Z');
  });

  it('pushIsEmpty cuando local y remoto coinciden', () => {
    const w = makeWorkout({ id: 'same', updatedAt: '2026-01-10T00:00:00.000Z' });
    const base = remote({ workouts: [w], settings: settings('2026-01-01T00:00:00.000Z') });
    const { push } = mergeSnapshot(
      local({ workouts: [w], settings: settings('2026-01-01T00:00:00.000Z') }),
      base,
    );
    expect(pushIsEmpty(push)).toBe(true);
  });
});
