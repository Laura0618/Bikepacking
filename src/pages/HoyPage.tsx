import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../store/AppDataProvider';
import { Card } from '../components/ui/Card';
import { StatTile } from '../components/ui/StatTile';
import { EmptyState } from '../components/ui/EmptyState';
import { AlertBanner } from '../components/ui/AlertBanner';
import { WorkoutRow } from '../components/WorkoutRow';
import { PageHeader } from '../components/ui/PageHeader';
import { QuickLogPanel } from '../components/QuickLogPanel';
import { collectAlerts } from '../lib/alerts';
import {
  currentLoadKg,
  currentStreakDays,
  weeklyActualHours,
  weeklyPlannedHours,
} from '../lib/calculations';
import { diffInDays, formatLongDate, formatMinutes, todayISO } from '../lib/dates';
import { nextPlannedWorkout, upcomingWorkouts, weekSummary } from '../lib/selectors';
import { MONTH_MILESTONE_HINTS } from '../lib/plan';
import { intensityCue, postLogObservation, sessionRationale, shortVersionMinutes } from '../lib/coaching';
import { INTENSITY_LABEL, WORKOUT_TYPE_LABEL } from '../lib/labels';
import type { Workout } from '../types';

interface UndoState {
  id: string;
  prev: Partial<Workout>;
  message: string;
}

function snapshot(w: Workout): Partial<Workout> {
  return {
    status: w.status,
    actualDurationMinutes: w.actualDurationMinutes,
    workoutType: w.workoutType,
    notes: w.notes,
    painLevel: w.painLevel,
    effortRpe: w.effortRpe,
  };
}

export function HoyPage(): JSX.Element {
  const { data, updateWorkout } = useAppData();
  const today = todayISO();
  const { workouts, strengthSessions, settings } = data;

  const next = useMemo(() => nextPlannedWorkout(workouts, today), [workouts, today]);
  const upcoming = useMemo(() => upcomingWorkouts(workouts, 3, today), [workouts, today]);
  const alerts = useMemo(() => collectAlerts(workouts, today), [workouts, today]);
  const summary = useMemo(
    () => weekSummary(workouts, strengthSessions, today),
    [workouts, strengthSessions, today],
  );

  const [quickOpen, setQuickOpen] = useState(false);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(undoTimer.current);
  }, []);

  const armUndo = (state: UndoState): void => {
    setUndo(state);
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndo(null), 10_000);
  };

  const plannedH = weeklyPlannedHours(workouts, today);
  const actualH = weeklyActualHours(workouts, today);
  const streak = currentStreakDays(workouts, today);
  const load = currentLoadKg(workouts, today);
  const daysToTrip = diffInDays(today, settings.tripDate);
  const planMonth = next?.planMonth ?? 1;

  const applyWithUndo = (w: Workout, patch: Partial<Workout>, message: string): void => {
    armUndo({ id: w.id, prev: snapshot(w), message });
    updateWorkout(w.id, patch);
    setQuickOpen(false);
  };

  const saveQuick = (w: Workout, patch: Partial<Workout>): void => {
    const merged: Workout = { ...w, ...patch };
    applyWithUndo(w, patch, postLogObservation(merged, workouts));
  };

  const completeShort = (w: Workout): void => {
    const mins = shortVersionMinutes(w);
    applyWithUndo(
      w,
      { status: 'partial', actualDurationMinutes: mins },
      `Version corta registrada (${formatMinutes(mins)}). Salir aunque sea poco tambien suma.`,
    );
  };

  const turnIntoRest = (w: Workout): void => {
    applyWithUndo(
      w,
      {
        status: 'completed',
        workoutType: 'descanso',
        actualDurationMinutes: 0,
        notes: w.notes ? `${w.notes} · Cambiado por descanso.` : 'Cambiado por descanso.',
      },
      'Hoy descansas. Cuenta como sesion cumplida: recuperar es parte del plan.',
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Hoy"
        subtitle={
          daysToTrip >= 0
            ? `Faltan ${daysToTrip} dias para el viaje (${formatLongDate(settings.tripDate)}).`
            : 'La fecha del viaje ya paso. Actualizala en Ajustes.'
        }
      />

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertBanner key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {undo && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-bosque bg-bosque-suave p-3">
          <p role="status" className="text-sm text-texto">
            {undo.message}
          </p>
          <button
            type="button"
            className="boton-secundario shrink-0 px-3 py-1 text-sm"
            onClick={() => {
              updateWorkout(undo.id, undo.prev);
              setUndo(null);
            }}
          >
            Deshacer
          </button>
        </div>
      )}

      <Card
        title="Que hago hoy"
        action={
          <Link to="/calendario" className="text-sm font-semibold text-bosque">
            Calendario
          </Link>
        }
      >
        {next ? (
          <div className="space-y-3">
            <p className="text-sm text-texto-suave">
              {next.date === today
                ? 'Para hoy'
                : diffInDays(today, next.date) === 1
                  ? 'Manana'
                  : `Proxima: ${formatLongDate(next.date)}`}
            </p>

            <div className="rounded-2xl border border-bosque-suave bg-bosque-suave/40 p-4">
              <p className="text-lg font-bold text-bosque-oscuro">
                {WORKOUT_TYPE_LABEL[next.workoutType]} · {formatMinutes(next.plannedDurationMinutes)}
              </p>
              <p className="mt-1 text-sm text-texto">
                {INTENSITY_LABEL[next.intensity]}. {intensityCue(next.intensity)}
              </p>
              {next.loadKg > 0 && (
                <p className="mt-1 text-sm text-recuperacion">Equipaje: {next.loadKg} kg</p>
              )}
              <p className="mt-2 rounded-xl bg-superficie/70 p-2 text-sm text-texto-suave">
                <span className="font-semibold text-texto">Por que hoy: </span>
                {sessionRationale(next, workouts)}
              </p>
            </div>

            <details className="rounded-xl border border-bosque-suave bg-superficie p-3 text-sm">
              <summary className="cursor-pointer font-semibold text-bosque">Ver detalles</summary>
              <p className="mt-2 text-texto-suave">{next.notes || 'Sin notas adicionales.'}</p>
              <p className="mt-2 text-texto-suave">
                Enfoque del mes {planMonth}: {MONTH_MILESTONE_HINTS[planMonth]}
              </p>
            </details>

            {next.status === 'planned' && next.workoutType !== 'descanso' && !quickOpen && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="boton-primario"
                  onClick={() => setQuickOpen(true)}
                >
                  Registrar al volver
                </button>
                <button type="button" className="boton-secundario" onClick={() => completeShort(next)}>
                  Version corta ({formatMinutes(shortVersionMinutes(next))})
                </button>
                <Link to="/calendario" className="boton-secundario">
                  Mover
                </Link>
                <button type="button" className="boton-secundario" onClick={() => turnIntoRest(next)}>
                  Hoy descanso
                </button>
              </div>
            )}

            {next.status === 'planned' && quickOpen && (
              <QuickLogPanel
                workout={next}
                onSave={(patch) => saveQuick(next, patch)}
                onCancel={() => setQuickOpen(false)}
              />
            )}

            <p className="text-xs text-texto-suave">
              Para un registro completo (equipaje, distancia, mas notas) usa{' '}
              <Link
                to={`/registro?workout=${encodeURIComponent(next.id)}`}
                className="font-semibold text-bosque"
              >
                Registrar
              </Link>
              .
            </p>
          </div>
        ) : (
          <EmptyState
            title="No hay entrenamientos planificados"
            message="Genera el plan de seis meses desde Ajustes o crea una salida en Registro."
            action={
              <Link to="/ajustes" className="boton-primario">
                Ir a Ajustes
              </Link>
            }
          />
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Semana"
          value={`${actualH} / ${plannedH} h`}
          hint={`${summary.doneSessions} de ${summary.plannedSessions} salidas`}
          tone="bosque"
        />
        <StatTile
          label="Dias activos seguidos"
          value={`${streak} ${streak === 1 ? 'dia' : 'dias'}`}
          hint="Los descansos previstos protegen el plan"
          tone="recuperacion"
        />
        <StatTile
          label="Carga actual"
          value={load > 0 ? `${load} kg` : 'sin carga aun'}
          hint="Maximo de las ultimas 3 semanas"
        />
        <StatTile
          label="Fuerza"
          value={`${summary.strengthDone} / ${summary.strengthPlanned}`}
          hint="Sesiones de fuerza esta semana"
        />
      </div>

      <Card
        title="Proximos dias"
        action={
          <Link to="/calendario" className="text-sm font-semibold text-bosque">
            Ver los demas
          </Link>
        }
      >
        {upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map((w) => (
              <WorkoutRow key={w.id} workout={w} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Agenda vacia"
            message="Cuando tengas entrenamientos planificados apareceran aqui."
          />
        )}
      </Card>

      <Card title="Recordatorio de confort">
        <ul className="list-disc space-y-1 pl-5 text-sm text-texto-suave">
          <li>La prioridad es terminar comoda, no rapida.</li>
          <li>Si notas dolor de 5/10 o mas, para y descansa.</li>
          <li>No subas duracion y peso del equipaje en la misma semana.</li>
          <li>Come y bebe antes de tener hambre o sed en las salidas largas.</li>
        </ul>
      </Card>
    </div>
  );
}
