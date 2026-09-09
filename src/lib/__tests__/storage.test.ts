import { describe, expect, it } from 'vitest';
import { createInitialData, exportToJSON, importFromJSON, parseAppData } from '../storage';

describe('storage', () => {
  it('crea datos iniciales con el plan de 24 semanas precargado', () => {
    const data = createInitialData('2026-01-05');
    expect(data.version).toBe(1);
    expect(new Set(data.workouts.map((w) => w.planWeek)).size).toBe(24);
    expect(data.milestones).toHaveLength(6);
  });

  it('exporta e importa sin perder informacion', () => {
    const data = createInitialData('2026-01-05');
    const roundTrip = importFromJSON(exportToJSON(data));
    expect(roundTrip.workouts.length).toBe(data.workouts.length);
    expect(roundTrip.settings.startDate).toBe('2026-01-05');
  });

  it('lanza un error legible si el JSON no tiene ajustes', () => {
    expect(() => parseAppData({ workouts: [] })).toThrow(/ajustes/i);
  });

  it('normaliza dias de entrenamiento y unidades invalidas', () => {
    const parsed = parseAppData({
      settings: { startDate: '2026-01-05', preferredTrainingDays: [2, 9, 'x'], units: 'raras' },
      workouts: [],
    });
    expect(parsed.settings.preferredTrainingDays).toEqual([2]);
    expect(parsed.settings.units).toBe('metric');
  });
});
