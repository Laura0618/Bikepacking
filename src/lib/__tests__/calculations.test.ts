import { describe, expect, it } from 'vitest';
import {
  currentStreakDays,
  longestRideMinutes,
  longestStreakDays,
  weeklyActualHours,
  weeklyHoursSeries,
  weeklyPlannedHours,
} from '../calculations';
import { makeWorkout } from '../../test/factories';

// Semana ISO: lunes 2026-01-05 ... domingo 2026-01-11.

describe('weeklyActualHours', () => {
  it('suma los minutos reales de las salidas hechas en la semana', () => {
    const workouts = [
      makeWorkout({ date: '2026-01-06', actualDurationMinutes: 45 }),
      makeWorkout({ date: '2026-01-08', actualDurationMinutes: 75 }),
      makeWorkout({ date: '2026-01-11', actualDurationMinutes: 120 }),
    ];
    expect(weeklyActualHours(workouts, '2026-01-07')).toBe(4); // 240 min
  });

  it('ignora salidas de otras semanas y las no realizadas', () => {
    const workouts = [
      makeWorkout({ date: '2026-01-06', actualDurationMinutes: 60 }),
      makeWorkout({ date: '2026-01-12', actualDurationMinutes: 90 }), // semana siguiente
      makeWorkout({ date: '2026-01-07', status: 'planned', actualDurationMinutes: null }),
      makeWorkout({ date: '2026-01-09', status: 'skipped', actualDurationMinutes: null }),
    ];
    expect(weeklyActualHours(workouts, '2026-01-05')).toBe(1);
  });

  it('usa la duracion planificada cuando esta completada sin duracion real', () => {
    const workouts = [
      makeWorkout({
        date: '2026-01-06',
        status: 'completed',
        actualDurationMinutes: null,
        plannedDurationMinutes: 90,
      }),
    ];
    expect(weeklyActualHours(workouts, '2026-01-06')).toBe(1.5);
  });
});

describe('weeklyPlannedHours', () => {
  it('suma la duracion planificada de la semana sin contar las saltadas', () => {
    const workouts = [
      makeWorkout({ date: '2026-01-06', plannedDurationMinutes: 60, status: 'planned' }),
      makeWorkout({ date: '2026-01-08', plannedDurationMinutes: 60, status: 'completed' }),
      makeWorkout({ date: '2026-01-09', plannedDurationMinutes: 120, status: 'skipped' }),
    ];
    expect(weeklyPlannedHours(workouts, '2026-01-05')).toBe(2);
  });
});

describe('longestRideMinutes y rachas', () => {
  it('devuelve la salida realizada mas larga', () => {
    const workouts = [
      makeWorkout({ actualDurationMinutes: 60 }),
      makeWorkout({ actualDurationMinutes: 185 }),
      makeWorkout({ actualDurationMinutes: 120, status: 'planned' }),
    ];
    expect(longestRideMinutes(workouts)).toBe(185);
  });

  it('cuenta la racha maxima de dias consecutivos', () => {
    const workouts = [
      makeWorkout({ date: '2026-02-10' }),
      makeWorkout({ date: '2026-02-11' }),
      makeWorkout({ date: '2026-02-12' }),
      makeWorkout({ date: '2026-02-14' }),
    ];
    expect(longestStreakDays(workouts)).toBe(3);
  });

  it('cuenta la racha actual hacia atras desde la fecha de referencia', () => {
    const workouts = [
      makeWorkout({ date: '2026-03-02' }),
      makeWorkout({ date: '2026-03-03' }),
      makeWorkout({ date: '2026-03-04' }),
    ];
    expect(currentStreakDays(workouts, '2026-03-04')).toBe(3);
    expect(currentStreakDays(workouts, '2026-03-06')).toBe(0);
  });
});

describe('weeklyHoursSeries', () => {
  it('marca como descarga las semanas del plan con factor de reduccion', () => {
    // planWeek 8 es semana de descarga (mes 2).
    const workouts = [
      makeWorkout({
        date: '2026-01-06',
        planWeek: 8,
        planMonth: 2,
        fromPlan: true,
        status: 'planned',
        actualDurationMinutes: null,
        plannedDurationMinutes: 42,
      }),
    ];
    const series = weeklyHoursSeries(workouts, '2026-01-05', '2026-01-11');
    expect(series).toHaveLength(1);
    expect(series[0]?.isDeload).toBe(true);
  });
});
