// Reductor y tipos del estado global de la app. Sin React aqui para poder testear.

import type {
  AppData,
  StrengthSession,
  Tombstone,
  UserSettings,
  Workout,
} from '../types';
import { nowISO } from '../lib/dates';
import { reconcileMilestones } from '../lib/milestones';
import { generatePlan } from '../lib/plan';
import { createInitialData } from '../lib/storage';

/** Entrada para crear entidades: el reductor pone `updatedAt`/`deletedAt`. */
export type WorkoutInput = Omit<Workout, 'updatedAt' | 'deletedAt'>;
export type StrengthSessionInput = Omit<StrengthSession, 'updatedAt' | 'deletedAt'>;

export type AppAction =
  | { type: 'replace'; data: AppData }
  | { type: 'reset'; startDate?: string }
  | { type: 'regeneratePlan' }
  | { type: 'updateSettings'; patch: Partial<UserSettings> }
  | { type: 'addWorkout'; workout: WorkoutInput }
  | { type: 'updateWorkout'; id: string; patch: Partial<Workout> }
  | { type: 'deleteWorkout'; id: string }
  | { type: 'addStrengthSession'; session: StrengthSessionInput }
  | { type: 'updateStrengthSession'; id: string; patch: Partial<StrengthSession> }
  | { type: 'deleteStrengthSession'; id: string };

function withMilestones(data: AppData): AppData {
  return { ...data, milestones: reconcileMilestones(data.milestones, data.workouts) };
}

const TOMBSTONE_TTL_MS = 45 * 86_400_000;

/** Anade (o refresca) una tumba y descarta las muy antiguas ya sincronizadas. */
function addTombstone(list: Tombstone[], entry: Tombstone): Tombstone[] {
  const cutoff = Date.now() - TOMBSTONE_TTL_MS;
  const kept = list.filter(
    (t) =>
      !(t.entity === entry.entity && t.id === entry.id) &&
      new Date(t.deletedAt).getTime() >= cutoff,
  );
  return [...kept, entry];
}

export function appDataReducer(state: AppData, action: AppAction): AppData {
  switch (action.type) {
    case 'replace':
      return withMilestones(action.data);

    case 'reset':
      return createInitialData(action.startDate);

    case 'regeneratePlan': {
      const stamp = nowISO();
      const plan = generatePlan(state.settings.startDate, stamp);
      const manualWorkouts = state.workouts.filter((w) => !w.fromPlan);
      const manualStrength = state.strengthSessions.filter((s) => !s.fromPlan);
      return withMilestones({
        ...state,
        workouts: [...plan.workouts, ...manualWorkouts],
        strengthSessions: [...plan.strengthSessions, ...manualStrength],
        planGeneratedAt: stamp,
      });
    }

    case 'updateSettings':
      return withMilestones({
        ...state,
        settings: { ...state.settings, ...action.patch, updatedAt: nowISO(), deletedAt: null },
      });

    case 'addWorkout':
      return withMilestones({
        ...state,
        workouts: [
          ...state.workouts,
          { ...action.workout, updatedAt: nowISO(), deletedAt: null },
        ],
      });

    case 'updateWorkout':
      return withMilestones({
        ...state,
        workouts: state.workouts.map((w) =>
          w.id === action.id ? { ...w, ...action.patch, updatedAt: nowISO() } : w,
        ),
      });

    case 'deleteWorkout':
      return withMilestones({
        ...state,
        workouts: state.workouts.filter((w) => w.id !== action.id),
        tombstones: addTombstone(state.tombstones, {
          entity: 'workout',
          id: action.id,
          deletedAt: nowISO(),
        }),
      });

    case 'addStrengthSession':
      return {
        ...state,
        strengthSessions: [
          ...state.strengthSessions,
          { ...action.session, updatedAt: nowISO(), deletedAt: null },
        ],
      };

    case 'updateStrengthSession':
      return {
        ...state,
        strengthSessions: state.strengthSessions.map((s) =>
          s.id === action.id ? { ...s, ...action.patch, updatedAt: nowISO() } : s,
        ),
      };

    case 'deleteStrengthSession':
      return {
        ...state,
        strengthSessions: state.strengthSessions.filter((s) => s.id !== action.id),
        tombstones: addTombstone(state.tombstones, {
          entity: 'strengthSession',
          id: action.id,
          deletedAt: nowISO(),
        }),
      };

    default:
      return state;
  }
}
