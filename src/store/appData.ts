// Reductor y tipos del estado global de la app. Sin React aqui para poder testear.

import type { AppData, StrengthSession, UserSettings, Workout } from '../types';
import { reconcileMilestones } from '../lib/milestones';
import { generatePlan } from '../lib/plan';
import { createInitialData } from '../lib/storage';

export type AppAction =
  | { type: 'replace'; data: AppData }
  | { type: 'reset'; startDate?: string }
  | { type: 'regeneratePlan' }
  | { type: 'updateSettings'; patch: Partial<UserSettings> }
  | { type: 'addWorkout'; workout: Workout }
  | { type: 'updateWorkout'; id: string; patch: Partial<Workout> }
  | { type: 'deleteWorkout'; id: string }
  | { type: 'addStrengthSession'; session: StrengthSession }
  | { type: 'updateStrengthSession'; id: string; patch: Partial<StrengthSession> }
  | { type: 'deleteStrengthSession'; id: string };

function withMilestones(data: AppData): AppData {
  return { ...data, milestones: reconcileMilestones(data.milestones, data.workouts) };
}

export function appDataReducer(state: AppData, action: AppAction): AppData {
  switch (action.type) {
    case 'replace':
      return withMilestones(action.data);

    case 'reset':
      return createInitialData(action.startDate);

    case 'regeneratePlan': {
      const plan = generatePlan(state.settings.startDate);
      const manualWorkouts = state.workouts.filter((w) => !w.fromPlan);
      const manualStrength = state.strengthSessions.filter((s) => !s.fromPlan);
      return withMilestones({
        ...state,
        workouts: [...plan.workouts, ...manualWorkouts],
        strengthSessions: [...plan.strengthSessions, ...manualStrength],
        planGeneratedAt: new Date().toISOString(),
      });
    }

    case 'updateSettings':
      return withMilestones({
        ...state,
        settings: { ...state.settings, ...action.patch },
      });

    case 'addWorkout':
      return withMilestones({ ...state, workouts: [...state.workouts, action.workout] });

    case 'updateWorkout':
      return withMilestones({
        ...state,
        workouts: state.workouts.map((w) =>
          w.id === action.id ? { ...w, ...action.patch } : w,
        ),
      });

    case 'deleteWorkout':
      return withMilestones({
        ...state,
        workouts: state.workouts.filter((w) => w.id !== action.id),
      });

    case 'addStrengthSession':
      return { ...state, strengthSessions: [...state.strengthSessions, action.session] };

    case 'updateStrengthSession':
      return {
        ...state,
        strengthSessions: state.strengthSessions.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s,
        ),
      };

    case 'deleteStrengthSession':
      return {
        ...state,
        strengthSessions: state.strengthSessions.filter((s) => s.id !== action.id),
      };

    default:
      return state;
  }
}
