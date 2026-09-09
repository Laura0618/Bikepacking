import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../store/AppDataProvider';
import { Card } from '../components/ui/Card';
import { StatTile } from '../components/ui/StatTile';
import { EmptyState } from '../components/ui/EmptyState';
import { AlertBanner } from '../components/ui/AlertBanner';
import { WorkoutRow } from '../components/WorkoutRow';
import { PageHeader } from '../components/ui/PageHeader';
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
import { intensityCue, sessionRationale, shortVersionMinutes } from '../lib/coaching';
import { INTENSITY_LABEL, WORKOUT_TYPE_LABEL } from '../lib/labels';
import type { Workout } from '../types';

export function HoyPage(): JSX.Element {
  const { data, updateWorkout } = useAppData();
  const today = todayISO();
  const { workouts, strengthSessions, settings } = data;

  const next = useMemo(() => nextPlannedWorkout(workouts, today), [workouts, today]);
  const upcoming = useMemo(() => upcomingWorkouts(workouts, 5, today), [workouts, today]);
  const alerts = useMemo(() => collectAlerts(workouts, today), [workouts, today]);
  const summary = useMemo(
    () => weekSummary(workouts, strengthSessions, today),
    [workouts, strengthSessions, today],
  );

  const [confirmacion, setConfirmacion] = useState<string | null>(null);

  const plannedH = weeklyPlannedHours(workouts, today);
  const actualH = weeklyActualHours(workouts, today);
  const streak = currentStreakDays(workouts, today);
  const load = currentLoadKg(workouts, today);
  const daysToTrip = diffInDays(today, settings.tripDate);
  const planMonth = next?.planMonth ?? 1;

  const completeFull = (w: Workout): void => {
    updateWorkout(w.id, {
      status: 'completed',
      actualDurationMinutes: w.actualDurationMinutes ?? w.plannedDurationMinutes,
    });
    setConfirmacion('Sesion completada. Buen trabajo por mantener la constancia.');
  };

  const completeShort = (w: Workout): void => {
    const mins = shortVersionMinutes(w);
    updateWorkout(w.id, { status: 'partial', actualDurationMinutes: mins });
    setConfirmacion(
      `Version corta registrada (${formatMinutes(mins)}). Salir aunque sea poco tambien suma.`,
    );
  };

  const turnIntoRest = (w: Workout): void => {
    updateWorkout(w.id, {
      status: 'completed',
      workoutType: 'descanso',
      actualDurationMinutes: 0,
      notes: w.notes ? `${w.notes} · Cambiado por descanso.` : 'Cambiado por descanso.',
    });
    setConfirmacion('Hoy descansas. Cuenta como sesion cumplida: recuperar es parte del plan.');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Hoy"
        subtitle={
          daysToTrip >= 0
            ? `Faltan ${daysToTrip} dias para el viaje (${formatLongDate(settings.tripDate)}).`
            : 'La fecha del viaje ya paso. Ajustala en Ajustes.'
        }
      />

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertBanner key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {confirmacion && (
        <p role="status" className="rounded-2xl bg-bosque-suave p-3 text-sm font-semibold text-bosque-oscuro">
          {confirmacion}
        </p>
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
              {next.date === today ? 'Para hoy' : `Proxima: ${formatLongDate(next.date)}`}
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

            {next.status === 'planned' && next.workoutType !== 'descanso' && (
              <div className="flex flex-wrap gap-2">
                <button type="button" className="boton-primario" onClick={() => completeFull(next)}>
                  Marcar como hecha
                </button>
                <button
                  type="button"
                  className="boton-secundario"
                  onClick={() => completeShort(next)}
                >
                  Version corta ({formatMinutes(shortVersionMinutes(next))})
                </button>
                <Link to="/calendario" className="boton-secundario">
                  Mover
                </Link>
                <button
                  type="button"
                  className="boton-secundario"
                  onClick={() => turnIntoRest(next)}
                >
                  Hoy descanso
                </button>
              </div>
            )}
            <p className="text-xs text-texto-suave">
              Para registrar sensaciones (esfuerzo, dolor, notas) usa{' '}
              <Link to={`/registro?workout=${encodeURIComponent(next.id)}`} className="font-semibold text-bosque">
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
          label="Racha"
          value={`${streak} ${streak === 1 ? 'dia' : 'dias'}`}
          hint="Dias seguidos con actividad"
          tone="recuperacion"
        />
        <StatTile
          label="Carga actual"
          value={`${load} kg`}
          hint="Maximo de las ultimas 3 semanas"
        />
        <StatTile
          label="Fuerza"
          value={`${summary.strengthDone} / ${summary.strengthPlanned}`}
          hint="Sesiones de fuerza esta semana"
        />
      </div>

      <Card title="Proximos dias">
        {upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map((w) => (
              <WorkoutRow key={w.id} workout={w} onQuickComplete={(id) => {
                const target = workouts.find((x) => x.id === id);
                if (target) completeFull(target);
              }} />
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
