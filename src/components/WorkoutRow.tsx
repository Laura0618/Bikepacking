import { Link } from 'react-router-dom';
import type { Workout } from '../types';
import { formatMinutes, formatShortDate, weekdayShort } from '../lib/dates';
import { INTENSITY_LABEL, STATUS_LABEL, STATUS_TONE, WORKOUT_TYPE_LABEL } from '../lib/labels';
import { Badge } from './ui/Badge';

interface WorkoutRowProps {
  workout: Workout;
  onQuickComplete?: (id: string) => void;
  showDate?: boolean;
}

export function WorkoutRow({
  workout,
  onQuickComplete,
  showDate = true,
}: WorkoutRowProps): JSX.Element {
  const done = workout.status === 'completed' || workout.status === 'partial';
  const minutes =
    workout.actualDurationMinutes ?? workout.plannedDurationMinutes;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-bosque-suave bg-superficie p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-texto">
            {WORKOUT_TYPE_LABEL[workout.workoutType]}
          </span>
          <Badge tone={STATUS_TONE[workout.status]}>{STATUS_LABEL[workout.status]}</Badge>
          {workout.loadKg > 0 && <Badge tone="recuperacion">{workout.loadKg} kg</Badge>}
        </div>
        <p className="mt-0.5 text-sm text-texto-suave">
          {showDate && (
            <>
              {weekdayShort(workout.date)} {formatShortDate(workout.date)} ·{' '}
            </>
          )}
          {formatMinutes(minutes)} · {INTENSITY_LABEL[workout.intensity]}
          {done && workout.painLevel !== undefined && workout.painLevel > 0 && (
            <> · dolor {workout.painLevel}/10</>
          )}
        </p>
        {workout.notes && (
          <p className="mt-1 line-clamp-2 text-xs text-texto-suave">{workout.notes}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        {onQuickComplete && !done && workout.workoutType !== 'descanso' && (
          <button
            type="button"
            className="boton-secundario px-3 py-1 text-sm"
            onClick={() => onQuickComplete(workout.id)}
          >
            Hecho
          </button>
        )}
        <Link
          to={`/registro?workout=${encodeURIComponent(workout.id)}`}
          className="boton-secundario px-3 py-1 text-sm"
        >
          {done ? 'Editar' : 'Registrar'}
        </Link>
      </div>
    </div>
  );
}
