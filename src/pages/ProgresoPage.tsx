import { useMemo } from 'react';
import { useAppData } from '../store/AppDataProvider';
import { Card } from '../components/ui/Card';
import { StatTile } from '../components/ui/StatTile';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { WeeklyHoursChart } from '../components/charts/WeeklyHoursChart';
import { TrendChart } from '../components/charts/TrendChart';
import {
  consecutiveDaysSeries,
  currentLoadKg,
  loadSeries,
  longestRideMinutes,
  longestRideSeries,
  longestStreakDays,
  weeklyActualHours,
  weeklyHoursSeries,
} from '../lib/calculations';
import { formatLongDate, formatMinutes, todayISO } from '../lib/dates';

export function ProgresoPage(): JSX.Element {
  const { data } = useAppData();
  const { workouts, settings, milestones } = data;
  const today = todayISO();

  const rangeEnd = settings.tripDate > today ? settings.tripDate : today;

  const hoursData = useMemo(
    () => weeklyHoursSeries(workouts, settings.startDate, rangeEnd),
    [workouts, settings.startDate, rangeEnd],
  );
  const longestData = useMemo(
    () =>
      longestRideSeries(workouts, settings.startDate, rangeEnd).map((p) => ({
        label: p.label,
        value: Math.round((p.minutes / 60) * 10) / 10,
      })),
    [workouts, settings.startDate, rangeEnd],
  );
  const loadData = useMemo(
    () =>
      loadSeries(workouts, settings.startDate, rangeEnd).map((p) => ({
        label: p.label,
        value: p.maxLoadKg,
      })),
    [workouts, settings.startDate, rangeEnd],
  );
  const streakData = useMemo(
    () =>
      consecutiveDaysSeries(workouts, settings.startDate, rangeEnd).map((p) => ({
        label: p.label,
        value: p.streak,
      })),
    [workouts, settings.startDate, rangeEnd],
  );

  const doneCount = workouts.filter(
    (w) => w.status === 'completed' || w.status === 'partial',
  ).length;
  const hasData = doneCount > 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Progreso"
        subtitle="Consistencia, salida larga, carga de equipaje y dias consecutivos."
      />

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Salidas hechas" value={doneCount} tone="bosque" />
        <StatTile
          label="Salida mas larga"
          value={formatMinutes(longestRideMinutes(workouts))}
          tone="recuperacion"
        />
        <StatTile label="Horas esta semana" value={`${weeklyActualHours(workouts, today)} h`} />
        <StatTile label="Racha maxima" value={`${longestStreakDays(workouts)} dias`} />
        <StatTile label="Carga actual" value={`${currentLoadKg(workouts, today)} kg`} />
        <StatTile
          label="Hitos logrados"
          value={`${milestones.filter((m) => m.achievedAt).length} / ${milestones.length}`}
          tone="bosque"
        />
      </div>

      {!hasData && (
        <EmptyState
          title="Aun no hay datos"
          message="Registra tus primeras salidas para ver las graficas de evolucion."
        />
      )}

      <Card title="Horas por semana">
        <WeeklyHoursChart data={hoursData} />
        <p className="mt-2 text-xs text-texto-suave">
          Las semanas de descarga aparecen con menos volumen planificado, es intencionado.
        </p>
      </Card>

      <Card title="Salida mas larga por semana (horas)">
        <TrendChart data={longestData} name="Salida larga" unit="h" color="#2f5d3a" />
      </Card>

      <Card title="Carga de equipaje por semana (kg)">
        <TrendChart data={loadData} name="Equipaje" unit="kg" color="#d98a3d" />
      </Card>

      <Card title="Dias consecutivos por semana">
        <TrendChart data={streakData} name="Dias seguidos" color="#3d7fa6" />
      </Card>

      <Card title="Hitos">
        <ul className="space-y-2">
          {milestones.map((m) => (
            <li
              key={m.id}
              className="flex items-start gap-3 rounded-xl border border-bosque-suave bg-superficie p-3"
            >
              <span aria-hidden="true" className="text-xl">
                {m.achievedAt ? '✅' : '⬜'}
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-texto">{m.label}</span>
                  {m.achievedAt ? (
                    <Badge tone="bosque">Logrado</Badge>
                  ) : (
                    <Badge tone="neutro">Pendiente</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-texto-suave">{m.condition}</p>
                {m.achievedAt && (
                  <p className="mt-0.5 text-xs text-bosque">
                    Conseguido el {formatLongDate(m.achievedAt)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
