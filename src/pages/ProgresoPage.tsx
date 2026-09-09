import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../store/AppDataProvider';
import { Card } from '../components/ui/Card';
import { StatTile } from '../components/ui/StatTile';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { WeeklyHoursChart } from '../components/charts/WeeklyHoursChart';
import { TrendChart } from '../components/charts/TrendChart';
import { ChartDataTable } from '../components/charts/ChartDataTable';
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
import { preparationStatus, type PreparacionNivel } from '../lib/coaching';

const NIVEL_TONE: Record<PreparacionNivel, 'bosque' | 'recuperacion' | 'alerta' | 'neutro'> = {
  empezando: 'neutro',
  en_camino: 'recuperacion',
  casi_listo: 'recuperacion',
  listo: 'bosque',
  precaucion: 'alerta',
};

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
    () => longestRideSeries(workouts, settings.startDate, rangeEnd),
    [workouts, settings.startDate, rangeEnd],
  );
  const loadData = useMemo(
    () => loadSeries(workouts, settings.startDate, rangeEnd),
    [workouts, settings.startDate, rangeEnd],
  );
  const streakData = useMemo(
    () => consecutiveDaysSeries(workouts, settings.startDate, rangeEnd),
    [workouts, settings.startDate, rangeEnd],
  );

  const doneCount = workouts.filter(
    (w) => w.status === 'completed' || w.status === 'partial',
  ).length;
  const hasData = doneCount > 0;
  const prep = preparationStatus(data, today);
  const longest = longestRideMinutes(workouts);
  const load = currentLoadKg(workouts, today);
  const streakMax = longestStreakDays(workouts);

  const longestChart = longestData.map((p) => ({
    label: p.label,
    value: Math.round((p.minutes / 60) * 10) / 10,
  }));
  const loadChart = loadData.map((p) => ({ label: p.label, value: p.maxLoadKg }));
  const streakChart = streakData.map((p) => ({ label: p.label, value: p.streak }));

  const lastWithData = [...hoursData].reverse().find((p) => p.actualHours > 0);
  const readingHoras = lastWithData
    ? `Ultima semana con actividad: ${lastWithData.actualHours} h frente a ${lastWithData.plannedHours} h previstas.`
    : 'Aun sin horas registradas esta temporada.';
  const readingLarga =
    longest > 0
      ? `Tu salida mas larga hasta ahora: ${formatMinutes(longest)}. El plan llega hasta 3 h.`
      : 'Todavia sin salidas registradas.';
  const readingCarga =
    load > 0
      ? `Carga practicada mas alta: ${load} kg. Objetivo del viaje: 8-9 kg.`
      : 'Aun no has rodado con equipaje.';
  const readingDias =
    streakMax > 0
      ? `Racha maxima dentro de una semana: ${streakMax} ${streakMax === 1 ? 'dia' : 'dias'}. La simulacion pide 4 seguidos.`
      : 'Aun sin dias consecutivos registrados.';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Progreso"
        subtitle="Consistencia, salida larga, carga de equipaje y dias consecutivos."
      />

      <Card title="Estado de preparacion">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-texto">{prep.titulo}</span>
          <Badge tone={NIVEL_TONE[prep.nivel]}>
            {milestones.filter((m) => m.achievedAt).length} / {milestones.length} hitos
          </Badge>
        </div>
        <p className="mt-2 rounded-xl bg-bosque-suave/50 p-3 text-sm text-texto">
          <span className="font-semibold">Siguiente paso: </span>
          {prep.siguientePaso}
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {prep.condiciones.map((c) => (
            <li key={c.label} className="flex items-center gap-2">
              <span aria-hidden="true">{c.cumplida ? '✅' : '⬜'}</span>
              <span className={c.cumplida ? 'text-texto' : 'text-texto-suave'}>{c.label}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Salidas hechas" value={hasData ? doneCount : 'sin registro'} tone="bosque" />
        <StatTile
          label="Salida mas larga"
          value={longest > 0 ? formatMinutes(longest) : 'sin registro'}
          tone="recuperacion"
        />
        <StatTile label="Horas esta semana" value={`${weeklyActualHours(workouts, today)} h`} />
        <StatTile label="Racha maxima" value={streakMax > 0 ? `${streakMax} dias` : 'sin registro'} />
        <StatTile label="Carga actual" value={load > 0 ? `${load} kg` : 'sin carga aun'} />
        <StatTile
          label="Hitos logrados"
          value={`${milestones.filter((m) => m.achievedAt).length} / ${milestones.length}`}
          tone="bosque"
        />
      </div>

      {!hasData ? (
        <Card>
          <div className="py-4 text-center">
            <p className="text-3xl" aria-hidden="true">
              🚲
            </p>
            <h2 className="mt-2 text-base font-bold text-texto">
              Tu progreso empieza con la primera salida
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-texto-suave">
              Registrar 45 min suaves desbloqueara tu tendencia semanal. Cada salida anadida
              rellena estas graficas y activa hitos.
            </p>
            <Link to="/registro" className="boton-primario mt-4">
              Registrar salida
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <Card title="Horas por semana">
            <p className="mb-2 text-sm text-texto">{readingHoras}</p>
            <WeeklyHoursChart data={hoursData} />
            <p className="mt-2 text-xs text-texto-suave">
              Las semanas de descarga aparecen con menos volumen planificado, es intencionado.
            </p>
            <ChartDataTable
              caption="Horas planificadas y realizadas por semana"
              columns={['Semana', 'Planificado (h)', 'Realizado (h)', 'Descarga']}
              rows={hoursData.map((p) => [
                p.label,
                p.plannedHours,
                p.actualHours,
                p.isDeload ? 'si' : '',
              ])}
            />
          </Card>

          <Card title="Salida mas larga por semana (horas)">
            <p className="mb-2 text-sm text-texto">{readingLarga}</p>
            <TrendChart data={longestChart} name="Salida larga" unit="h" color="#2f5d3a" />
            <ChartDataTable
              caption="Salida mas larga por semana en horas"
              columns={['Semana', 'Horas']}
              rows={longestChart.map((p) => [p.label, p.value])}
            />
          </Card>

          <Card title="Carga de equipaje por semana (kg)">
            <p className="mb-2 text-sm text-texto">{readingCarga}</p>
            <TrendChart
              data={loadChart}
              name="Equipaje"
              unit="kg"
              color="#a65b19"
              domain={[0, 9]}
            />
            <p className="mt-2 text-xs text-texto-suave">
              Escala fija a 9 kg, el objetivo del viaje. No subas kg y duracion la misma semana.
            </p>
            <ChartDataTable
              caption="Carga maxima de equipaje por semana en kg"
              columns={['Semana', 'kg']}
              rows={loadChart.map((p) => [p.label, p.value])}
            />
          </Card>

          <Card title="Dias consecutivos por semana">
            <p className="mb-2 text-sm text-texto">{readingDias}</p>
            <TrendChart data={streakChart} name="Dias seguidos" color="#3d7fa6" />
            <ChartDataTable
              caption="Racha maxima de dias seguidos dentro de cada semana"
              columns={['Semana', 'Dias']}
              rows={streakChart.map((p) => [p.label, p.value])}
            />
          </Card>
        </>
      )}

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
