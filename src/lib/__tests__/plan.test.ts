import { describe, expect, it } from 'vitest';
import {
  deloadFactor,
  generatePlan,
  isDeloadWeek,
  isTaperWeek,
  sessionsForWeek,
} from '../plan';
import { monthNumberOfWeek, weekWithinMonth } from '../planTemplates';

describe('semanas de descarga', () => {
  it('marca como descarga las semanas 8, 12, 16 y 23', () => {
    expect(isDeloadWeek(8)).toBe(true);
    expect(isDeloadWeek(12)).toBe(true);
    expect(isDeloadWeek(16)).toBe(true);
    expect(isDeloadWeek(23)).toBe(true);
  });

  it('no marca como descarga las semanas normales ni el bloque especial (semana 20)', () => {
    expect(isDeloadWeek(7)).toBe(false);
    expect(isDeloadWeek(20)).toBe(false);
    expect(isDeloadWeek(24)).toBe(false);
  });

  it('la semana 24 es de afinamiento (taper), no de descarga', () => {
    expect(isTaperWeek(24)).toBe(true);
    expect(isTaperWeek(23)).toBe(false);
  });

  it('cada semana de descarga cae en la cuarta semana de su mes', () => {
    for (const week of [8, 12, 16]) {
      expect(weekWithinMonth(week)).toBe(4);
    }
    expect(monthNumberOfWeek(8)).toBe(2);
    expect(monthNumberOfWeek(23)).toBe(6);
  });

  it('reduce el volumen respecto a la semana previa del mismo mes', () => {
    const factor = deloadFactor(12); // 0.7
    const base = sessionsForWeek(11).reduce((sum, s) => sum + s.minutes, 0);
    const deload = sessionsForWeek(12).reduce((sum, s) => sum + s.minutes, 0);
    expect(deload).toBeLessThan(base);
    expect(deload).toBeLessThanOrEqual(Math.ceil(base * factor) + sessionsForWeek(12).length * 5);
  });

  it('la semana 23 reduce alrededor del 40% (factor 0.6)', () => {
    expect(deloadFactor(23)).toBe(0.6);
  });
});

describe('generatePlan', () => {
  it('genera 24 semanas y seis meses a partir del lunes de la fecha de inicio', () => {
    const plan = generatePlan('2026-01-07'); // miercoles -> lunes 2026-01-05
    expect(plan.months).toHaveLength(6);
    const planWeeks = new Set(plan.workouts.map((w) => w.planWeek));
    expect(planWeeks.size).toBe(24);
    expect(plan.workouts.every((w) => w.date >= '2026-01-05')).toBe(true);
    expect(plan.workouts.every((w) => w.status === 'planned' && w.fromPlan)).toBe(true);
  });

  it('aplica la carga progresiva del mes 4 (3 -> 8 kg) a las salidas de fin de semana', () => {
    const plan = generatePlan('2026-01-05');
    const loadOf = (week: number): number =>
      Math.max(
        ...plan.workouts
          .filter((w) => w.planWeek === week && w.loadKg > 0)
          .map((w) => w.loadKg),
      );
    expect(loadOf(13)).toBe(3);
    expect(loadOf(15)).toBe(7);
    expect(loadOf(16)).toBe(8);
  });

  it('incluye la simulacion de cuatro dias consecutivos en la semana 22', () => {
    const plan = generatePlan('2026-01-05');
    const sim = plan.workouts
      .filter((w) => w.planWeek === 22)
      .map((w) => w.date)
      .sort();
    expect(sim).toHaveLength(4);
    // cuatro fechas consecutivas
    for (let i = 1; i < sim.length; i += 1) {
      const prev = new Date(`${sim[i - 1]}T00:00:00`).getTime();
      const cur = new Date(`${sim[i]}T00:00:00`).getTime();
      expect((cur - prev) / 86_400_000).toBe(1);
    }
  });

  it('mantiene solo una sesion de fuerza en semanas de descarga', () => {
    const plan = generatePlan('2026-01-05');
    const strengthWeek7 = plan.strengthSessions.filter((s) => s.planWeek === 7).length;
    const strengthWeek8 = plan.strengthSessions.filter((s) => s.planWeek === 8).length;
    expect(strengthWeek7).toBe(2);
    expect(strengthWeek8).toBe(1);
  });
});
