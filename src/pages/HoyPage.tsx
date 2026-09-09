import { useMemo } from 'react';
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

  const plannedH = weeklyPlannedHours(workouts, today);
  const actualH = weeklyActualHours(workouts, today);
  const streak = currentStreakDays(workouts, today);
  const load = currentLoadKg(workouts, today);
  const daysToTrip = diffInDays(today, settings.tripDate);
  const planMonth = next?.planMonth ?? 1;

  const quickComplete = (id: string): void => {
    const w = workouts.find((x) => x.id === id);
    if (!w) return;
    updateWorkout(id, {
      status: 'completed',
      actualDurationMinutes: w.actualDurationMinutes ?? w.plannedDurationMinutes,
    });
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

      <Card
        title="Proximo entrenamiento"
        action={
          <Link to="/calendario" className="text-sm font-semibold text-bosque">
            Ver calendario
          </Link>
        }
      >
        {next ? (
          <div className="space-y-3">
            <p className="text-sm text-texto-suave">{formatLongDate(next.date)}</p>
            <WorkoutRow workout={next} onQuickComplete={quickComplete} showDate={false} />
            <p className="rounded-xl bg-bosque-suave/60 p-3 text-sm text-bosque-oscuro">
              Enfoque del mes {planMonth}: {MONTH_MILESTONE_HINTS[planMonth]}
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

      <Card title="Proximos dias">
        {upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map((w) => (
              <WorkoutRow key={w.id} workout={w} onQuickComplete={quickComplete} />
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
        <p className="mt-3 text-xs text-texto-suave">
          Duracion prevista de hoy:{' '}
          {next && next.date === today ? formatMinutes(next.plannedDurationMinutes) : 'sin salida'}.
        </p>
      </Card>
    </div>
  );
}
