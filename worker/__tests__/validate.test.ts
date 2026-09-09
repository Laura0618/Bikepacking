import { describe, expect, it } from 'vitest';
import { parseSyncPush } from '../validate';

const ISO = '2026-03-01T10:00:00.000Z';

function goodBody(): Record<string, unknown> {
  return {
    settings: {
      startDate: '2026-01-05',
      tripDate: '2026-07-05',
      preferredTrainingDays: [2, 4, 6],
      units: 'metric',
      updatedAt: ISO,
      deletedAt: null,
    },
    workouts: [{ id: 'w1', date: '2026-03-01', updatedAt: ISO, deletedAt: null }],
    strengthSessions: [],
    milestones: [{ id: 'noventa_min', updatedAt: ISO, deletedAt: null }],
    tombstones: [{ entity: 'workout', id: 'w9', deletedAt: ISO }],
  };
}

describe('parseSyncPush', () => {
  it('acepta un cuerpo bien formado', () => {
    const parsed = parseSyncPush(goodBody());
    expect(parsed).not.toBeNull();
    expect(parsed?.workouts).toHaveLength(1);
    expect(parsed?.tombstones[0]?.id).toBe('w9');
  });

  it('acepta settings nulo', () => {
    const body = { ...goodBody(), settings: null };
    expect(parseSyncPush(body)).not.toBeNull();
  });

  it('rechaza updatedAt que no es ISO datetime', () => {
    const body = goodBody();
    (body.workouts as { updatedAt: string }[])[0]!.updatedAt = '2026-03-01';
    expect(parseSyncPush(body)).toBeNull();
  });

  it('rechaza filas sin id', () => {
    const body = goodBody();
    body.workouts = [{ updatedAt: ISO, deletedAt: null }];
    expect(parseSyncPush(body)).toBeNull();
  });

  it('rechaza filas gigantes', () => {
    const body = goodBody();
    body.workouts = [{ id: 'big', updatedAt: ISO, deletedAt: null, notes: 'x'.repeat(50_000) }];
    expect(parseSyncPush(body)).toBeNull();
  });

  it('rechaza tombstones con entidad desconocida', () => {
    const body = goodBody();
    body.tombstones = [{ entity: 'otro', id: 'z', deletedAt: ISO }];
    expect(parseSyncPush(body)).toBeNull();
  });

  it('rechaza settings con units invalido', () => {
    const body = goodBody();
    (body.settings as { units: string }).units = 'raras';
    expect(parseSyncPush(body)).toBeNull();
  });
});
