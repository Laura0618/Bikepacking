import { describe, expect, it } from 'vitest';
import { collectAlerts, painAlert, progressionAlert, recoveryAlert } from '../alerts';
import { makeWorkout } from '../../test/factories';

describe('painAlert', () => {
  it('avisa cuando el dolor es 5/10 o mas', () => {
    const alert = painAlert(makeWorkout({ painLevel: 5 }));
    expect(alert).not.toBeNull();
    expect(alert?.level).toBe('alerta');
    expect(alert?.message).toMatch(/consulta a un profesional/i);
  });

  it('no avisa con dolor menor que 5 o sin dato', () => {
    expect(painAlert(makeWorkout({ painLevel: 4 }))).toBeNull();
    expect(painAlert(makeWorkout({ painLevel: undefined }))).toBeNull();
  });
});

describe('progressionAlert', () => {
  it('avisa si suben a la vez duracion (>20%) y carga (>2 kg)', () => {
    const workouts = [
      makeWorkout({ date: '2026-05-02', actualDurationMinutes: 120, loadKg: 3 }),
      makeWorkout({ date: '2026-05-09', actualDurationMinutes: 160, loadKg: 7 }),
    ];
    const alert = progressionAlert(workouts);
    expect(alert).not.toBeNull();
    expect(alert?.message).toMatch(/una variable cada vez/i);
  });

  it('no avisa si solo sube la duracion', () => {
    const workouts = [
      makeWorkout({ date: '2026-05-02', actualDurationMinutes: 120, loadKg: 4 }),
      makeWorkout({ date: '2026-05-09', actualDurationMinutes: 170, loadKg: 4 }),
    ];
    expect(progressionAlert(workouts)).toBeNull();
  });

  it('no avisa si solo sube la carga', () => {
    const workouts = [
      makeWorkout({ date: '2026-05-02', actualDurationMinutes: 120, loadKg: 2 }),
      makeWorkout({ date: '2026-05-09', actualDurationMinutes: 122, loadKg: 8 }),
    ];
    expect(progressionAlert(workouts)).toBeNull();
  });
});

describe('recoveryAlert y collectAlerts', () => {
  it('recomienda recuperar tras 6 dias seguidos', () => {
    const workouts = Array.from({ length: 6 }, (_, i) =>
      makeWorkout({ date: `2026-06-0${i + 1}` }),
    );
    const alert = recoveryAlert(workouts, '2026-06-06');
    expect(alert?.level).toBe('recuperacion');
  });

  it('collectAlerts pone la alerta de dolor la primera', () => {
    const workouts = [
      makeWorkout({ date: '2026-06-01', painLevel: 7 }),
      ...Array.from({ length: 6 }, (_, i) => makeWorkout({ date: `2026-06-0${i + 1}` })),
    ];
    const alerts = collectAlerts(workouts, '2026-06-06');
    expect(alerts[0]?.level).toBe('alerta');
    expect(alerts.some((a) => a.level === 'recuperacion')).toBe(true);
  });
});
