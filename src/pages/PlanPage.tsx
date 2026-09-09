import { useMemo, useState } from 'react';
import { useAppData } from '../store/AppDataProvider';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { WorkoutRow } from '../components/WorkoutRow';
import { diffInDays, formatMinutes, formatShortDate, todayISO } from '../lib/dates';
import { isDeloadWeek, isTaperWeek, MONTH_MILESTONE_HINTS } from '../lib/plan';
import { PLAN_MONTHS_META } from '../lib/planTemplates';
import { sortByDate } from '../lib/selectors';
import type { Workout } from '../types';

export function PlanPage(): JSX.Element {
  const { data } = useAppData();
  const planWorkouts = useMemo(
    () => data.workouts.filter((w) => w.fromPlan && w.planMonth !== undefined),
    [data.workouts],
  );

  const today = todayISO();
  const elapsedWeeks = Math.floor(diffInDays(data.settings.startDate, today) / 7);
  const currentWeek = Math.min(24, Math.max(1, elapsedWeeks + 1));
  const currentMonth = Math.min(6, Math.max(1, Math.ceil(currentWeek / 4)));
  const beforeStart = diffInDays(data.settings.startDate, today) < 0;

  const nextMilestone = data.milestones.find((m) => !m.achievedAt);

  const [openMonth, setOpenMonth] = useState<number>(currentMonth);

  const byMonth = useMemo(() => {
    const map = new Map<number, Map<number, Workout[]>>();
    for (const w of planWorkouts) {
      const month = w.planMonth ?? 0;
      const week = w.planWeek ?? 0;
      if (!map.has(month)) map.set(month, new Map());
      const weeks = map.get(month) as Map<number, Workout[]>;
      weeks.set(week, [...(weeks.get(week) ?? []), w]);
    }
    return map;
  }, [planWorkouts]);

  if (planWorkouts.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Plan de seis meses" />
        <EmptyState
          title="Sin plan generado"
          message="Ve a Ajustes y pulsa 'Regenerar plan' para cargar las 24 semanas."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Plan hacia la ruta"
        subtitle={beforeStart ? 'El plan empieza en la fecha de inicio.' : `Mes ${currentMonth} de 6`}
      />

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-sm">
            <span className="font-semibold text-bosque">Ahora: </span>
            {PLAN_MONTHS_META[currentMonth - 1]?.focus}
          </p>
          <p className="text-sm text-texto-suave">
            Proximo hito: {nextMilestone ? nextMilestone.label : 'todos logrados'}
          </p>
        </div>
        <p className="mt-2 text-sm text-texto-suave">
          Semana {currentWeek} de 24 ·{' '}
          {PLAN_MONTHS_META[currentMonth - 1]?.weeklyHoursMin}-
          {PLAN_MONTHS_META[currentMonth - 1]?.weeklyHoursMax} h previstas
        </p>
        <button
          type="button"
          className="boton-primario mt-3"
          onClick={() => setOpenMonth(currentMonth)}
        >
          Ver semana actual
        </button>
      </Card>

      {PLAN_MONTHS_META.map((meta) => {
        const weeks = byMonth.get(meta.monthNumber);
        const isOpen = openMonth === meta.monthNumber;
        const isPast = !beforeStart && meta.monthNumber < currentMonth;
        const isCurrent = !beforeStart && meta.monthNumber === currentMonth;
        const weekNumbers = weeks ? Array.from(weeks.keys()).sort((a, b) => a - b) : [];
        return (
          <Card
            key={meta.monthNumber}
            className={isCurrent ? 'border-bosque ring-1 ring-bosque' : undefined}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setOpenMonth(isOpen ? -1 : meta.monthNumber)}
              aria-expanded={isOpen}
            >
              <span>
                <span className="text-base font-bold text-bosque-oscuro">
                  Mes {meta.monthNumber}
                </span>
                {isPast && (
                  <span className="ml-2 align-middle" aria-label="mes pasado">
                    <Badge tone="bosque">✓ hecho</Badge>
                  </span>
                )}
                {isCurrent && (
                  <span className="ml-2 align-middle">
                    <Badge tone="recuperacion">Ahora</Badge>
                  </span>
                )}
                <span className="ml-2 text-sm text-texto-suave">
                  {meta.weeklyHoursMin}-{meta.weeklyHoursMax} h/semana · larga hasta{' '}
                  {formatMinutes(meta.longestRideMinutes)}
                </span>
              </span>
              <span aria-hidden="true" className="text-texto-suave">
                {isOpen ? '−' : '+'}
              </span>
            </button>

            <p className="mt-2 text-sm text-texto-suave">{meta.focus}</p>
            <p className="mt-1 text-sm">
              <span className="font-semibold text-bosque">Hito objetivo: </span>
              {MONTH_MILESTONE_HINTS[meta.monthNumber]}
            </p>

            {isOpen && (
              <div className="mt-4 space-y-4">
                {weekNumbers.map((weekNumber) => {
                  const list = sortByDate(weeks?.get(weekNumber) ?? []);
                  const first = list[0];
                  const totalMin = list.reduce(
                    (sum, w) => sum + w.plannedDurationMinutes,
                    0,
                  );
                  return (
                    <div key={weekNumber} className="rounded-xl bg-fondo p-3">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-texto">Semana {weekNumber}</span>
                        {first && (
                          <span className="text-xs text-texto-suave">
                            desde {formatShortDate(first.date)}
                          </span>
                        )}
                        <span className="text-xs text-texto-suave">
                          · {formatMinutes(totalMin)} planificados
                        </span>
                        {isDeloadWeek(weekNumber) && <Badge tone="recuperacion">Descarga</Badge>}
                        {isTaperWeek(weekNumber) && <Badge tone="alerta">Afinamiento</Badge>}
                      </div>
                      {isDeloadWeek(weekNumber) && (
                        <p className="mb-2 text-xs text-recuperacion">
                          Semana de recuperacion: se reduce el volumen para consolidar la adaptacion.
                          No la compenses aumentando otras salidas.
                        </p>
                      )}
                      {isTaperWeek(weekNumber) && (
                        <p className="mb-2 text-xs text-alerta">
                          Afinamiento: salidas cortas y dos dias de descanso antes del viaje.
                        </p>
                      )}
                      <div className="space-y-2">
                        {list.map((w) => (
                          <WorkoutRow key={w.id} workout={w} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
