import { useMemo } from 'react';
import { useAppData } from '../store/AppDataProvider';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { STRENGTH_EXERCISES, STRENGTH_ROUTINES } from '../lib/strength';
import { addDays, formatShortDate, startOfWeek, todayISO, weekdayShort } from '../lib/dates';
import { STATUS_LABEL, STATUS_TONE } from '../lib/labels';
import { createId } from '../lib/id';
import { sortByDate } from '../lib/selectors';

export function FuerzaPage(): JSX.Element {
  const { data, updateStrengthSession, addStrengthSession } = useAppData();
  const today = todayISO();
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);

  const weekSessions = useMemo(
    () =>
      sortByDate(
        data.strengthSessions.filter((s) => s.date >= weekStart && s.date <= weekEnd),
      ),
    [data.strengthSessions, weekStart, weekEnd],
  );

  const logToday = (): void => {
    addStrengthSession({
      id: createId('str'),
      date: today,
      exercises: STRENGTH_ROUTINES[0]?.ejercicios ?? [],
      status: 'completed',
      notes: 'Sesion registrada manualmente.',
      fromPlan: false,
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fuerza"
        subtitle="Rutinas cortas para tolerar horas sobre la bici y el equipaje."
        action={
          <button type="button" className="boton-secundario text-sm" onClick={logToday}>
            Registrar hoy
          </button>
        }
      />

      <Card title="Fuerza de esta semana">
        {weekSessions.length === 0 ? (
          <EmptyState
            icon="💪"
            title="Sin fuerza planificada esta semana"
            message="Puedes registrar una sesion manual con el boton de arriba."
          />
        ) : (
          <ul className="space-y-2">
            {weekSessions.map((s) => {
              const done = s.status === 'completed' || s.status === 'partial';
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-bosque-suave bg-superficie p-3"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-texto">
                        {weekdayShort(s.date)} {formatShortDate(s.date)}
                      </span>
                      <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-texto-suave">{s.notes}</p>
                  </div>
                  {!done && (
                    <button
                      type="button"
                      className="boton-secundario px-3 py-1 text-sm"
                      onClick={() => updateStrengthSession(s.id, { status: 'completed' })}
                    >
                      Hecho
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {STRENGTH_ROUTINES.map((routine) => (
        <Card key={routine.id} title={routine.titulo}>
          <p className="text-sm text-texto-suave">{routine.descripcion}</p>
          <p className="mt-1 text-xs font-semibold text-bosque">Duracion: {routine.duracion}</p>
          <ul className="mt-3 space-y-2">
            {routine.ejercicios.map((exId) => {
              const ex = STRENGTH_EXERCISES[exId];
              return (
                <li key={exId} className="rounded-xl bg-fondo p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-texto">{ex.nombre}</span>
                    <span className="text-sm text-texto-suave">
                      {ex.series} x {ex.repeticiones}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-bosque">
                    {ex.foco}
                  </p>
                  <p className="mt-1 text-sm text-texto-suave">{ex.descripcion}</p>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}

      <Card title="Como progresar sin lesionarte">
        <ul className="list-disc space-y-1 pl-5 text-sm text-texto-suave">
          <li>Empieza sin peso o con mochila ligera y buena tecnica.</li>
          <li>Deja siempre 1 o 2 repeticiones en reserva; nada al fallo.</li>
          <li>Si un ejercicio molesta una articulacion, cambialo o reduce el rango.</li>
          <li>En semanas de descarga y el ultimo mes, solo activacion suave.</li>
        </ul>
      </Card>
    </div>
  );
}
