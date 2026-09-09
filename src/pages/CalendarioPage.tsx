import { useMemo, useState } from 'react';
import { useAppData } from '../store/AppDataProvider';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { WorkoutRow } from '../components/WorkoutRow';
import { EmptyState } from '../components/ui/EmptyState';
import {
  addDays,
  endOfMonth,
  formatShortDate,
  monthName,
  parseISODate,
  startOfMonth,
  startOfWeek,
  todayISO,
  weekdayShort,
} from '../lib/dates';
import { STATUS_LABEL, STATUS_MARK, WORKOUT_TYPE_LABEL } from '../lib/labels';
import { workoutsOnDate } from '../lib/selectors';
import { rescheduleImpact } from '../lib/coaching';
import type { WorkoutStatus } from '../types';

type View = 'semana' | 'mes';

interface UndoInfo {
  id: string;
  fromDate: string;
  toDate: string;
  impact: string;
}

const MARK_TONE: Record<WorkoutStatus, string> = {
  planned: 'text-recuperacion',
  completed: 'text-bosque',
  partial: 'text-recuperacion',
  skipped: 'text-alerta',
};

export function CalendarioPage(): JSX.Element {
  const { data, rescheduleWorkout } = useAppData();
  const [view, setView] = useState<View>('semana');
  const [cursor, setCursor] = useState<string>(todayISO());
  const [selectedDay, setSelectedDay] = useState<string>(todayISO());
  const [undo, setUndo] = useState<UndoInfo | null>(null);

  const move = (id: string, fromDate: string, toDate: string): void => {
    if (!toDate || toDate === fromDate) return;
    const workout = data.workouts.find((w) => w.id === id);
    const impact = workout ? rescheduleImpact(data.workouts, workout, toDate) : '';
    rescheduleWorkout(id, toDate);
    setSelectedDay(toDate);
    setUndo({ id, fromDate, toDate, impact });
  };

  const weekStart = startOfWeek(cursor);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const monthDays = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const gridStart = startOfWeek(first);
    const days: string[] = [];
    let d = gridStart;
    let guard = 0;
    while ((d <= last || parseISODate(d).getDay() !== 1) && guard < 42) {
      days.push(d);
      d = addDays(d, 1);
      guard += 1;
    }
    return days;
  }, [cursor]);

  const step = (dir: number): void => {
    setCursor((c) => addDays(c, dir * (view === 'semana' ? 7 : 30)));
  };

  const dayWorkouts = workoutsOnDate(data.workouts, selectedDay);

  return (
    <div className="space-y-4">
      <PageHeader title="Calendario" subtitle="Consulta y reprograma tus entrenamientos." />

      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border border-bosque-suave bg-superficie p-1">
          {(['semana', 'mes'] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              className={`min-h-touch rounded-lg px-3 text-sm font-semibold ${
                view === v ? 'bg-bosque text-white' : 'text-texto-suave'
              }`}
              onClick={() => setView(v)}
            >
              {v === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="boton-secundario px-3" onClick={() => step(-1)} aria-label="Anterior">
            ‹
          </button>
          <button
            type="button"
            className="boton-secundario px-3 text-sm"
            onClick={() => {
              setCursor(todayISO());
              setSelectedDay(todayISO());
            }}
          >
            Hoy
          </button>
          <button type="button" className="boton-secundario px-3" onClick={() => step(1)} aria-label="Siguiente">
            ›
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave">
        {(['planned', 'completed', 'partial', 'skipped'] as WorkoutStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className={`font-bold ${MARK_TONE[s]}`}>{STATUS_MARK[s]}</span>
            {STATUS_LABEL[s]}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span aria-hidden="true">🌙</span> Descanso
        </span>
        <span className="flex items-center gap-1">
          <span className="rounded bg-recuperacion-suave px-1 font-bold text-recuperacion">kg</span>{' '}
          Con equipaje
        </span>
      </div>

      {undo && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-recuperacion-claro bg-recuperacion-suave p-3">
          <p className="text-sm text-texto">
            <span className="font-semibold">Salida movida a {formatShortDate(undo.toDate)}.</span>{' '}
            {undo.impact}
          </p>
          <button
            type="button"
            className="boton-secundario shrink-0 px-3 py-1 text-sm"
            onClick={() => {
              rescheduleWorkout(undo.id, undo.fromDate);
              setSelectedDay(undo.fromDate);
              setUndo(null);
            }}
          >
            Deshacer
          </button>
        </div>
      )}

      {view === 'semana' ? (
        <Card
          title={`Semana del ${formatShortDate(weekStart)}`}
        >
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const list = workoutsOnDate(data.workouts, day);
              const isToday = day === todayISO();
              const isSelected = day === selectedDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`flex min-h-touch flex-col items-center rounded-lg border p-1 text-xs ${
                    isSelected
                      ? 'border-bosque bg-bosque-suave'
                      : 'border-bosque-suave bg-superficie'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="font-semibold">{weekdayShort(day)}</span>
                  <span className={isToday ? 'font-bold text-bosque' : ''}>
                    {parseISODate(day).getDate()}
                  </span>
                  <span className="mt-1 flex gap-0.5 font-bold leading-none" aria-hidden="true">
                    {list.slice(0, 3).map((w) => (
                      <span key={w.id} className={MARK_TONE[w.status]}>
                        {STATUS_MARK[w.status]}
                      </span>
                    ))}
                  </span>
                  {list.length > 0 && (
                    <span className="sr-only">
                      {list.length} entrenamiento(s): {list.map((w) => STATUS_LABEL[w.status]).join(', ')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card
          title={`${monthName(parseISODate(cursor).getMonth())} ${parseISODate(cursor).getFullYear()}`}
        >
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-texto-suave">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const list = workoutsOnDate(data.workouts, day);
              const inMonth = parseISODate(day).getMonth() === parseISODate(cursor).getMonth();
              const isSelected = day === selectedDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`flex min-h-[44px] flex-col items-center rounded-lg border p-1 text-xs ${
                    isSelected ? 'border-bosque bg-bosque-suave' : 'border-bosque-suave'
                  } ${inMonth ? 'bg-superficie' : 'bg-fondo text-texto-suave'}`}
                  aria-pressed={isSelected}
                >
                  <span className={day === todayISO() ? 'font-bold text-bosque' : ''}>
                    {parseISODate(day).getDate()}
                  </span>
                  {list.length > 0 && (
                    <span
                      className={`mt-0.5 text-[11px] font-bold leading-none ${MARK_TONE[list[0]?.status ?? 'planned']}`}
                      aria-hidden="true"
                    >
                      {STATUS_MARK[list[0]?.status ?? 'planned']}
                      {list.length > 1 ? `·${list.length}` : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Card title={`Dia seleccionado: ${formatShortDate(selectedDay)}`}>
        {dayWorkouts.length === 0 ? (
          <EmptyState
            title="Sin entrenamientos ese dia"
            message="Elige otro dia o crea una salida desde Registro."
          />
        ) : (
          <div className="space-y-3">
            {dayWorkouts.map((w) => (
              <div key={w.id} className="space-y-2">
                <WorkoutRow workout={w} showDate={false} />
                <label className="flex items-center gap-2 text-sm text-texto-suave">
                  <span className="shrink-0">Mover {WORKOUT_TYPE_LABEL[w.workoutType]} a:</span>
                  <input
                    type="date"
                    className="campo"
                    value={w.date}
                    onChange={(e) => move(w.id, w.date, e.target.value)}
                  />
                </label>
                {(w.workoutType === 'salida_larga' ||
                  w.workoutType === 'cargada' ||
                  w.workoutType === 'simulacion') && (
                  <p className="text-xs text-texto-suave">
                    Salida clave de la semana: al moverla, revisa la recuperacion del dia siguiente.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {dayWorkouts.some((w) => w.fromPlan) && (
          <p className="mt-3 text-xs text-texto-suave">
            <Badge tone="neutro">Plan</Badge> Reprogramar una sesion del plan no altera el resto de
            semanas.
          </p>
        )}
      </Card>
    </div>
  );
}
