import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { AppData, StrengthSession, UserSettings, Workout } from '../types';
import {
  createInitialData,
  exportToJSON,
  importFromJSON,
  loadAppData,
  saveAppData,
} from '../lib/storage';
import { appDataReducer, type StrengthSessionInput, type WorkoutInput } from './appData';

interface AppDataContextValue {
  data: AppData;
  updateSettings: (patch: Partial<UserSettings>) => void;
  addWorkout: (workout: WorkoutInput) => void;
  updateWorkout: (id: string, patch: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;
  rescheduleWorkout: (id: string, newDateISO: string) => void;
  addStrengthSession: (session: StrengthSessionInput) => void;
  updateStrengthSession: (id: string, patch: Partial<StrengthSession>) => void;
  deleteStrengthSession: (id: string) => void;
  regeneratePlan: () => void;
  resetAll: (startDate?: string) => void;
  replaceAll: (data: AppData) => void;
  exportJSON: () => string;
  importJSON: (text: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function init(): AppData {
  return loadAppData() ?? createInitialData();
}

export function AppDataProvider({ children }: { children: ReactNode }): JSX.Element {
  const [data, dispatch] = useReducer(appDataReducer, undefined, init);

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      updateSettings: (patch) => dispatch({ type: 'updateSettings', patch }),
      addWorkout: (workout) => dispatch({ type: 'addWorkout', workout }),
      updateWorkout: (id, patch) => dispatch({ type: 'updateWorkout', id, patch }),
      deleteWorkout: (id) => dispatch({ type: 'deleteWorkout', id }),
      rescheduleWorkout: (id, newDateISO) =>
        dispatch({ type: 'updateWorkout', id, patch: { date: newDateISO } }),
      addStrengthSession: (session) => dispatch({ type: 'addStrengthSession', session }),
      updateStrengthSession: (id, patch) =>
        dispatch({ type: 'updateStrengthSession', id, patch }),
      deleteStrengthSession: (id) => dispatch({ type: 'deleteStrengthSession', id }),
      regeneratePlan: () => dispatch({ type: 'regeneratePlan' }),
      resetAll: (startDate) => dispatch({ type: 'reset', startDate }),
      replaceAll: (next) => dispatch({ type: 'replace', data: next }),
      exportJSON: () => exportToJSON(data),
      importJSON: (text) => dispatch({ type: 'replace', data: importFromJSON(text) }),
    }),
    [data],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData debe usarse dentro de <AppDataProvider>.');
  return ctx;
}
