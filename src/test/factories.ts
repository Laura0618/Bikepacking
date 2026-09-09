import type { Workout } from '../types';

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
    ...overrides,
  };
}
