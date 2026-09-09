import { describe, expect, it } from 'vitest';
import { parseSyncPush } from '../validate';

const DT = '2026-03-01T10:00:00.000Z';

function workoutRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'w1',
    date: '2026-03-01',
    plannedDurationMinutes: 60,
    actualDurationMinutes: 58,
    workoutType: 'suave',
    intensity: 'suave',
    loadKg: 0,
    notes: '',
    status: 'completed',
    fromPlan: false,
    updatedAt: DT,
    deletedAt: null,
    ...over,
  };
}

function strengthRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 's1',
    date: '2026-03-01',
    exercises: ['sentadilla', 'plancha'],
    status: 'completed',
    notes: '',
    fromPlan: false,
    updatedAt: DT,
    deletedAt: null,
    ...over,
  };
}

function milestoneRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'noventa_min',
    label: '90 minutos comodos',
    condition: 'Una salida de 90 min...',
    achievedAt: null,
    updatedAt: DT,
    deletedAt: null,
    ...over,
  };
}

function goodBody(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    settings: {
      startDate: '2026-01-05',
      tripDate: '2026-07-05',
      preferredTrainingDays: [2, 4, 6],
      units: 'metric',
      updatedAt: DT,
      deletedAt: null,
    },
    workouts: [workoutRow()],
    strengthSessions: [strengthRow()],
    milestones: [milestoneRow()],
    tombstones: [{ entity: 'workout', id: 'w9', deletedAt: DT }],
    ...over,
  };
}

describe('parseSyncPush', () => {
  it('acepta un cuerpo bien formado', () => {
    const r = parseSyncPush(goodBody());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.workouts).toHaveLength(1);
      expect(r.value.tombstones[0]?.id).toBe('w9');
    }
  });

  it('acepta settings nulo y listas vacias', () => {
    const r = parseSyncPush({ settings: null, workouts: [], strengthSessions: [], milestones: [], tombstones: [] });
    expect(r.ok).toBe(true);
  });

  it('rechaza workoutType fuera del dominio con 400 claro', () => {
    const r = parseSyncPush(goodBody({ workouts: [workoutRow({ workoutType: 'volando' })] }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/entrenamientos/i);
  });

  it('rechaza intensity y status invalidos', () => {
    expect(parseSyncPush(goodBody({ workouts: [workoutRow({ intensity: 'brutal' })] })).ok).toBe(false);
    expect(parseSyncPush(goodBody({ workouts: [workoutRow({ status: 'medio' })] })).ok).toBe(false);
  });

  it('rechaza un milestone.id que no existe', () => {
    const r = parseSyncPush(goodBody({ milestones: [milestoneRow({ id: 'inventado' })] }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/hitos/i);
  });

  it('rechaza updatedAt que no es ISO datetime', () => {
    expect(parseSyncPush(goodBody({ workouts: [workoutRow({ updatedAt: '2026-03-01' })] })).ok).toBe(false);
  });

  it('rechaza date que no es YYYY-MM-DD', () => {
    expect(parseSyncPush(goodBody({ workouts: [workoutRow({ date: DT })] })).ok).toBe(false);
  });

  it('rechaza dolor o rpe fuera de rango', () => {
    expect(parseSyncPush(goodBody({ workouts: [workoutRow({ painLevel: 12 })] })).ok).toBe(false);
    expect(parseSyncPush(goodBody({ workouts: [workoutRow({ effortRpe: 0 })] })).ok).toBe(false);
  });

  it('rechaza filas sin id o con id repetido', () => {
    expect(parseSyncPush(goodBody({ workouts: [workoutRow({ id: undefined })] })).ok).toBe(false);
    expect(
      parseSyncPush(goodBody({ workouts: [workoutRow({ id: 'dup' }), workoutRow({ id: 'dup' })] })).ok,
    ).toBe(false);
  });

  it('rechaza filas gigantes', () => {
    const r = parseSyncPush(goodBody({ workouts: [workoutRow({ notes: 'x'.repeat(50_000) })] }));
    expect(r.ok).toBe(false);
  });

  it('rechaza tombstones con entidad desconocida', () => {
    expect(parseSyncPush(goodBody({ tombstones: [{ entity: 'otro', id: 'z', deletedAt: DT }] })).ok).toBe(
      false,
    );
  });

  it('rechaza settings con units invalido o dias fuera de 0-6', () => {
    expect(
      parseSyncPush(goodBody({ settings: { startDate: '2026-01-05', tripDate: '2026-07-05', preferredTrainingDays: [2], units: 'raras', updatedAt: DT, deletedAt: null } })).ok,
    ).toBe(false);
    expect(
      parseSyncPush(goodBody({ settings: { startDate: '2026-01-05', tripDate: '2026-07-05', preferredTrainingDays: [9], units: 'metric', updatedAt: DT, deletedAt: null } })).ok,
    ).toBe(false);
  });

  it('acepta un strength con exercises validos y rechaza exercises no-string', () => {
    expect(parseSyncPush(goodBody({ strengthSessions: [strengthRow()] })).ok).toBe(true);
    expect(parseSyncPush(goodBody({ strengthSessions: [strengthRow({ exercises: [1, 2] })] })).ok).toBe(
      false,
    );
  });
});
