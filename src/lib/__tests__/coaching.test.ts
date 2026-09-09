import { describe, expect, it } from 'vitest';
import {
  postLogObservation,
  preparationStatus,
  rescheduleImpact,
  sessionRationale,
  shortVersionMinutes,
} from '../coaching';
import { createInitialData } from '../storage';
import { makeWorkout } from '../../test/factories';

describe('shortVersionMinutes', () => {
  it('propone 35 min para sesiones largas y mantiene las cortas', () => {
    expect(shortVersionMinutes(makeWorkout({ plannedDurationMinutes: 120 }))).toBe(35);
    expect(shortVersionMinutes(makeWorkout({ plannedDurationMinutes: 40 }))).toBe(40);
  });
});

describe('sessionRationale', () => {
  it('explica la semana de descarga', () => {
    const w = makeWorkout({ planWeek: 8, status: 'planned', actualDurationMinutes: null });
    expect(sessionRationale(w, [w])).toMatch(/recuperacion/i);
  });

  it('reconoce que se viene de un descanso', () => {
    const rest = makeWorkout({ date: '2026-03-02', workoutType: 'descanso' });
    const w = makeWorkout({
      date: '2026-03-03',
      workoutType: 'suave',
      status: 'planned',
      actualDurationMinutes: null,
    });
    expect(sessionRationale(w, [rest, w])).toMatch(/descanso/i);
  });
});

describe('postLogObservation', () => {
  it('avisa de dolor alto tras registrar', () => {
    const saved = makeWorkout({ actualDurationMinutes: 90, painLevel: 6 });
    expect(postLogObservation(saved, [saved])).toMatch(/consulta a un profesional/i);
  });

  it('marca la salida mas larga hasta la fecha', () => {
    const prev = makeWorkout({ id: 'a', date: '2026-01-01', actualDurationMinutes: 60 });
    const saved = makeWorkout({ id: 'b', date: '2026-01-08', actualDurationMinutes: 130 });
    expect(postLogObservation(saved, [prev, saved])).toMatch(/mas larga/i);
  });

  it('no trata una sesion no realizada como fracaso', () => {
    const saved = makeWorkout({ status: 'skipped', actualDurationMinutes: null });
    expect(postLogObservation(saved, [saved])).toMatch(/no hace falta compensar/i);
  });
});

describe('rescheduleImpact', () => {
  it('detecta dias consecutivos alrededor de la nueva fecha', () => {
    const workouts = [
      makeWorkout({ id: 'sat', date: '2026-01-10' }),
      makeWorkout({ id: 'sun', date: '2026-01-11' }),
      makeWorkout({ id: 'mover', date: '2026-01-14' }),
    ];
    const moved = workouts[2];
    if (!moved) throw new Error('sin workout');
    expect(rescheduleImpact(workouts, moved, '2026-01-12')).toMatch(/3 dias seguidos/);
  });
});

describe('preparationStatus', () => {
  it('prioriza la precaucion cuando hay dolor alto reciente', () => {
    const data = createInitialData('2026-01-05');
    data.workouts = [
      makeWorkout({ date: '2026-01-06', actualDurationMinutes: 60, painLevel: 7 }),
    ];
    const status = preparationStatus(data, '2026-01-08');
    expect(status.nivel).toBe('precaucion');
  });

  it('empieza en nivel "empezando" sin hitos logrados', () => {
    const data = createInitialData('2026-01-05');
    expect(preparationStatus(data, '2026-01-10').nivel).toBe('empezando');
  });
});
