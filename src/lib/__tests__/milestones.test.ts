import { describe, expect, it } from 'vitest';
import { detectMilestoneDates, reconcileMilestones, initialMilestones } from '../milestones';
import { makeWorkout } from '../../test/factories';

describe('detectMilestoneDates', () => {
  it('no detecta nada sin entrenamientos', () => {
    const result = detectMilestoneDates([]);
    expect(Object.values(result).every((v) => v === null)).toBe(true);
  });

  it('detecta 90 min comodos solo si el dolor es menor que 5', () => {
    const conDolor = [makeWorkout({ date: '2026-01-10', actualDurationMinutes: 95, painLevel: 6 })];
    expect(detectMilestoneDates(conDolor).noventa_min).toBeNull();

    const sinDolor = [makeWorkout({ date: '2026-01-12', actualDurationMinutes: 95, painLevel: 2 })];
    expect(detectMilestoneDates(sinDolor).noventa_min).toBe('2026-01-12');
  });

  it('detecta 2 horas con una salida de 120 min o mas', () => {
    const workouts = [makeWorkout({ date: '2026-02-01', actualDurationMinutes: 125 })];
    expect(detectMilestoneDates(workouts).dos_horas).toBe('2026-02-01');
  });

  it('detecta 3 h cargada solo con 180 min y 5 kg o mas', () => {
    const ligera = [makeWorkout({ date: '2026-03-01', actualDurationMinutes: 190, loadKg: 3 })];
    expect(detectMilestoneDates(ligera).tres_horas_cargada).toBeNull();

    const cargada = [makeWorkout({ date: '2026-03-08', actualDurationMinutes: 185, loadKg: 8 })];
    expect(detectMilestoneDates(cargada).tres_horas_cargada).toBe('2026-03-08');
  });

  it('detecta fin de semana consecutivo con sabado y domingo seguidos', () => {
    const workouts = [
      makeWorkout({ date: '2026-01-10' }), // sabado
      makeWorkout({ date: '2026-01-11' }), // domingo
    ];
    expect(detectMilestoneDates(workouts).finde_consecutivo).toBe('2026-01-11');
  });

  it('detecta bloques de 3 y 4 dias consecutivos', () => {
    const tres = [
      makeWorkout({ date: '2026-04-06' }),
      makeWorkout({ date: '2026-04-07' }),
      makeWorkout({ date: '2026-04-08' }),
    ];
    expect(detectMilestoneDates(tres).bloque_tres_dias).toBe('2026-04-08');
    expect(detectMilestoneDates(tres).simulacion_cuatro_dias).toBeNull();

    const cuatro = [...tres, makeWorkout({ date: '2026-04-09' })];
    expect(detectMilestoneDates(cuatro).simulacion_cuatro_dias).toBe('2026-04-09');
  });
});

describe('reconcileMilestones', () => {
  it('conserva la fecha ya lograda aunque cambien los datos', () => {
    const base = initialMilestones().map((m) =>
      m.id === 'dos_horas' ? { ...m, achievedAt: '2026-02-01' } : m,
    );
    const reconciled = reconcileMilestones(base, []);
    expect(reconciled.find((m) => m.id === 'dos_horas')?.achievedAt).toBe('2026-02-01');
  });

  it('rellena hitos nuevos detectados a partir del historial', () => {
    const reconciled = reconcileMilestones(initialMilestones(), [
      makeWorkout({ date: '2026-02-02', actualDurationMinutes: 130 }),
    ]);
    expect(reconciled.find((m) => m.id === 'dos_horas')?.achievedAt).toBe('2026-02-02');
  });
});
