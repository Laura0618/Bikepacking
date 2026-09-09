import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppData,
  AuthUser,
  StrengthSession,
  SyncPullResponse,
  SyncStatus,
  UserSettings,
  Workout,
} from '../types';
import { nowISO } from '../lib/dates';
import {
  createInitialData,
  exportToJSON,
  hasUserData,
  importFromJSON,
  loadAppData,
  saveAppData,
} from '../lib/storage';
import { api, ApiError, LOGIN_URL } from '../lib/api';
import {
  applyMergeToAppData,
  isRemoteEmpty,
  mergeSnapshot,
  pushIsEmpty,
  toLocalSnapshot,
} from '../lib/syncEngine';
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

  // Cuenta y sincronizacion
  authStatus: 'loading' | 'signed_out' | 'signed_in';
  user: AuthUser | null;
  oauthConfigured: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  migrationPending: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  syncNow: () => void;
  confirmMigration: () => void;
  declineMigration: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function init(): AppData {
  return loadAppData() ?? createInitialData();
}

function localAsPull(data: AppData): SyncPullResponse {
  return { ...toLocalSnapshot(data), serverTime: nowISO(), lastSyncAt: null };
}

export function AppDataProvider({ children }: { children: ReactNode }): JSX.Element {
  const [data, dispatch] = useReducer(appDataReducer, undefined, init);

  const [authStatus, setAuthStatus] = useState<'loading' | 'signed_out' | 'signed_in'>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('signed_out');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [migrationPending, setMigrationPending] = useState(false);

  const dataRef = useRef(data);
  const baselineRef = useRef<SyncPullResponse | null>(null);
  const pendingRemoteRef = useRef<SyncPullResponse | null>(null);
  const initialSyncDoneRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onlineRef = useRef<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  // --- Aplicar estado del servidor sobre lo local -------------------------

  const applyServer = useCallback(
    (resp: SyncPullResponse, opts: { forceLocalDirty?: boolean } = {}) => {
      const result = mergeSnapshot(toLocalSnapshot(dataRef.current), resp, opts);
      if (result.changed) {
        dispatch({ type: 'replace', data: applyMergeToAppData(dataRef.current, result.merged) });
      }
      baselineRef.current = resp;
      setLastSyncAt(resp.lastSyncAt);
      return result;
    },
    [],
  );

  const doPush = useCallback(async (): Promise<void> => {
    const base = baselineRef.current;
    if (!base) return;
    const { push } = mergeSnapshot(toLocalSnapshot(dataRef.current), base);
    if (pushIsEmpty(push)) {
      setSyncStatus('synced');
      return;
    }
    setSyncStatus('saving');
    try {
      const resp = await api.syncPush(push);
      const cleared = { ...dataRef.current, tombstones: [] };
      const result = mergeSnapshot(toLocalSnapshot(cleared), resp);
      dispatch({ type: 'replace', data: applyMergeToAppData(cleared, result.merged) });
      baselineRef.current = resp;
      setLastSyncAt(resp.lastSyncAt);
      setSyncStatus('synced');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuthStatus('signed_out');
        setUser(null);
        setSyncStatus('signed_out');
        baselineRef.current = null;
        initialSyncDoneRef.current = false;
        return;
      }
      if (err instanceof ApiError && (err.status === 0 || err.code === 'network')) {
        setSyncStatus(onlineRef.current ? 'error' : 'offline');
        return;
      }
      setSyncStatus('error');
    }
  }, []);

  const schedulePush = useCallback(() => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      void doPush();
    }, 1500);
  }, [doPush]);

  const runInitialSync = useCallback(async (): Promise<void> => {
    setSyncStatus('saving');
    try {
      const remote = await api.syncPull();
      if (isRemoteEmpty(remote) && hasUserData(dataRef.current)) {
        pendingRemoteRef.current = remote;
        setMigrationPending(true);
        setSyncStatus('pending');
        return;
      }
      const { push } = applyServer(remote);
      initialSyncDoneRef.current = true;
      if (!pushIsEmpty(push)) {
        await doPush();
      } else {
        setSyncStatus('synced');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuthStatus('signed_out');
        setUser(null);
        setSyncStatus('signed_out');
        return;
      }
      setSyncStatus(onlineRef.current ? 'error' : 'offline');
    }
  }, [applyServer, doPush]);

  // --- Arranque: config + sesion ----------------------------------------

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const cfg = await api.config();
        if (!cancelled) setOauthConfigured(cfg.oauthConfigured);
      } catch {
        /* sin API disponible: modo solo local */
      }
      try {
        const me = await api.me();
        if (cancelled) return;
        setUser(me.user);
        setAuthStatus('signed_in');
        void runInitialSync();
      } catch {
        if (!cancelled) {
          setAuthStatus('signed_out');
          setSyncStatus('signed_out');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runInitialSync]);

  // --- Auto-push al cambiar los datos ----------------------------------

  useEffect(() => {
    if (authStatus !== 'signed_in' || !initialSyncDoneRef.current || migrationPending) return;
    setSyncStatus((s) => (s === 'saving' ? s : 'pending'));
    schedulePush();
  }, [data, authStatus, migrationPending, schedulePush]);

  // --- Conexion --------------------------------------------------------

  useEffect(() => {
    const onOnline = (): void => {
      onlineRef.current = true;
      if (authStatus === 'signed_in' && initialSyncDoneRef.current) void doPush();
    };
    const onOffline = (): void => {
      onlineRef.current = false;
      setSyncStatus((s) => (s === 'signed_out' ? s : 'offline'));
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [authStatus, doPush]);

  // --- Acciones de cuenta ---------------------------------------------

  const signIn = useCallback(() => {
    window.location.href = LOGIN_URL;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await api.logout();
    } catch {
      /* da igual: limpiamos el estado local igualmente */
    }
    setUser(null);
    setAuthStatus('signed_out');
    setSyncStatus('signed_out');
    setLastSyncAt(null);
    setMigrationPending(false);
    baselineRef.current = null;
    pendingRemoteRef.current = null;
    initialSyncDoneRef.current = false;
  }, []);

  const syncNow = useCallback(() => {
    if (authStatus !== 'signed_in') return;
    if (!initialSyncDoneRef.current) {
      void runInitialSync();
    } else {
      void doPush();
    }
  }, [authStatus, doPush, runInitialSync]);

  const confirmMigration = useCallback(() => {
    const remote = pendingRemoteRef.current;
    if (!remote) return;
    const { merged } = mergeSnapshot(toLocalSnapshot(dataRef.current), remote, {
      forceLocalDirty: true,
    });
    dispatch({ type: 'replace', data: applyMergeToAppData(dataRef.current, merged) });
    baselineRef.current = remote;
    pendingRemoteRef.current = null;
    setMigrationPending(false);
    initialSyncDoneRef.current = true;
    void doPush();
  }, [doPush]);

  const declineMigration = useCallback(() => {
    // No subir los datos locales existentes: la cuenta parte de cero y solo se
    // sincronizan los cambios a partir de ahora.
    baselineRef.current = localAsPull(dataRef.current);
    pendingRemoteRef.current = null;
    setMigrationPending(false);
    initialSyncDoneRef.current = true;
    setSyncStatus('synced');
  }, []);

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

      authStatus,
      user,
      oauthConfigured,
      syncStatus,
      lastSyncAt,
      migrationPending,
      signIn,
      signOut,
      syncNow,
      confirmMigration,
      declineMigration,
    }),
    [
      data,
      authStatus,
      user,
      oauthConfigured,
      syncStatus,
      lastSyncAt,
      migrationPending,
      signIn,
      signOut,
      syncNow,
      confirmMigration,
      declineMigration,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData debe usarse dentro de <AppDataProvider>.');
  return ctx;
}
