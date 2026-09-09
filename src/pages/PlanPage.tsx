import { useMemo, useState } from 'react';
import { useAppData } from '../store/AppDataProvider';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { WorkoutRow } from '../components/WorkoutRow';
import { formatMinutes, formatShortDate } from '../lib/dates';
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

  const [openMonth, setOpenMonth] = useState<number>(1);

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
        title="Plan de seis meses"
        subtitle="24 semanas. De 45-60 min a varios dias seguidos de 2-3 h con equipaje."
      />

      {PLAN_MONTHS_META.map((meta) => {
        const weeks = byMonth.get(meta.monthNumber);
        const isOpen = openMonth === meta.monthNumber;
        const weekNumbers = weeks ? Array.from(weeks.keys()).sort((a, b) => a - b) : [];
        return (
          <Card key={meta.monthNumber}>
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
