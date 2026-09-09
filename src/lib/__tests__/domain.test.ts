import { describe, expect, it } from 'vitest';
import {
  INTENSITIES,
  MILESTONE_IDS,
  WORKOUT_STATUSES,
  WORKOUT_TYPES,
  isIntensity,
  isMilestoneId,
  isWorkoutStatus,
  isWorkoutType,
} from '../domain';
import { INTENSITY_LABEL, STATUS_LABEL, WORKOUT_TYPE_LABEL } from '../labels';
import { MILESTONE_DEFS } from '../milestones';

describe('dominio: coherencia con el resto del codigo', () => {
  it('WORKOUT_TYPES cubre exactamente las claves de WORKOUT_TYPE_LABEL', () => {
    expect([...WORKOUT_TYPES].sort()).toEqual(Object.keys(WORKOUT_TYPE_LABEL).sort());
  });
  it('INTENSITIES cubre exactamente las claves de INTENSITY_LABEL', () => {
    expect([...INTENSITIES].sort()).toEqual(Object.keys(INTENSITY_LABEL).sort());
  });
  it('WORKOUT_STATUSES cubre exactamente las claves de STATUS_LABEL', () => {
    expect([...WORKOUT_STATUSES].sort()).toEqual(Object.keys(STATUS_LABEL).sort());
  });
  it('MILESTONE_IDS coincide con los ids de MILESTONE_DEFS', () => {
    expect([...MILESTONE_IDS].sort()).toEqual(MILESTONE_DEFS.map((m) => m.id).sort());
  });
});

describe('guards de dominio', () => {
  it('aceptan valores validos y rechazan el resto', () => {
    expect(isWorkoutType('cargada')).toBe(true);
    expect(isWorkoutType('volando')).toBe(false);
    expect(isIntensity('moderado')).toBe(true);
    expect(isIntensity('')).toBe(false);
    expect(isWorkoutStatus('partial')).toBe(true);
    expect(isWorkoutStatus('meh')).toBe(false);
    expect(isMilestoneId('dos_horas')).toBe(true);
    expect(isMilestoneId('tres_horas')).toBe(false);
  });
});
