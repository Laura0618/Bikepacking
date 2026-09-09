import type { StrengthSession, Workout } from '../types';

let counter = 0;

export function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  counter += 1;
  return {
    id: `test-${counter}`,
    date: '2026-01-05',
    plannedDurationMinutes: 60,
    actualDurationMinutes: 60,
    workoutType: 'suave',
    intensity: 'suave',
    loadKg: 0,
    notes: '',
    status: 'completed',
    fromPlan: false,
    updatedAt: '2026-01-05T10:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

export function makeStrengthSession(
  overrides: Partial<StrengthSession> = {},
): StrengthSession {
  counter += 1;
  return {
    id: `str-${counter}`,
    date: '2026-01-05',
    exercises: ['sentadilla', 'plancha'],
    status: 'completed',
    notes: '',
    fromPlan: false,
    updatedAt: '2026-01-05T10:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}
