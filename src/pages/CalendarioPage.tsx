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
import { WORKOUT_TYPE_LABEL } from '../lib/labels';
import { workoutsOnDate } from '../lib/selectors';

type View = 'semana' | 'mes';

export function CalendarioPage(): JSX.Element {
  const { data, rescheduleWorkout } = useAppData();
  const [view, setView] = useState<View>('semana');
  const [cursor, setCursor] = useState<string>(todayISO());
  const [selectedDay, setSelectedDay] = useState<string>(todayISO());

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
                  <span className="mt-1 flex gap-0.5">
                    {list.slice(0, 3).map((w) => (
                      <span
                        key={w.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          w.status === 'completed'
                            ? 'bg-bosque'
                            : w.status === 'skipped'
                              ? 'bg-alerta'
                              : 'bg-recuperacion-claro'
                        }`}
                      />
                    ))}
                  </span>
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
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-recuperacion-claro" />
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
                    onChange={(e) => {
                      if (e.target.value) {
                        rescheduleWorkout(w.id, e.target.value);
                        setSelectedDay(e.target.value);
                      }
                    }}
                  />
                </label>
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
