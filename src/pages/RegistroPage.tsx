import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppData } from '../store/AppDataProvider';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { AlertBanner } from '../components/ui/AlertBanner';
import { ConfirmButton } from '../components/ui/ConfirmButton';
import { painAlert, progressionAlert } from '../lib/alerts';
import { todayISO } from '../lib/dates';
import { createId } from '../lib/id';
import {
  INTENSITIES,
  INTENSITY_LABEL,
  STATUS_LABEL,
  WORKOUT_TYPES,
  WORKOUT_TYPE_LABEL,
} from '../lib/labels';
import type { Intensity, Workout, WorkoutStatus, WorkoutType } from '../types';

interface FormState {
  date: string;
  workoutType: WorkoutType;
  intensity: Intensity;
  plannedDurationMinutes: string;
  actualDurationMinutes: string;
  loadKg: string;
  distanceKm: string;
  effortRpe: string;
  painLevel: string;
  notes: string;
  status: WorkoutStatus;
}

function toForm(w: Workout | null): FormState {
  return {
    date: w?.date ?? todayISO(),
    workoutType: w?.workoutType ?? 'suave',
    intensity: w?.intensity ?? 'suave',
    plannedDurationMinutes: w ? String(w.plannedDurationMinutes) : '60',
    actualDurationMinutes:
      w?.actualDurationMinutes != null ? String(w.actualDurationMinutes) : '',
    loadKg: w ? String(w.loadKg) : '0',
    distanceKm: w?.distanceKm != null ? String(w.distanceKm) : '',
    effortRpe: w?.effortRpe != null ? String(w.effortRpe) : '',
    painLevel: w?.painLevel != null ? String(w.painLevel) : '',
    notes: w?.notes ?? '',
    status: w?.status ?? 'completed',
  };
}

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function RegistroPage(): JSX.Element {
  const { data, addWorkout, updateWorkout, deleteWorkout } = useAppData();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const editingId = params.get('workout');

  const editing = useMemo(
    () => data.workouts.find((w) => w.id === editingId) ?? null,
    [data.workouts, editingId],
  );

  const [form, setForm] = useState<FormState>(() => toForm(editing));
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setForm((f) => ({ ...f, [key]: value }));
    setSavedId(null);
  };

  const painPreview =
    parseOptionalNumber(form.painLevel) !== undefined &&
    (parseOptionalNumber(form.painLevel) as number) >= 5;

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    setError(null);

    const planned = Number(form.plannedDurationMinutes);
    if (!Number.isFinite(planned) || planned < 0) {
      setError('La duracion planificada debe ser un numero de minutos valido.');
      return;
    }
    const actual = parseOptionalNumber(form.actualDurationMinutes);
    if (form.status !== 'planned' && form.status !== 'skipped' && actual === undefined) {
      setError('Indica la duracion real para marcar la salida como completada o parcial.');
      return;
    }
    const rpe = parseOptionalNumber(form.effortRpe);
    if (rpe !== undefined && (rpe < 1 || rpe > 10)) {
      setError('El esfuerzo percibido (RPE) va de 1 a 10.');
      return;
    }
    const pain = parseOptionalNumber(form.painLevel);
    if (pain !== undefined && (pain < 0 || pain > 10)) {
      setError('El nivel de dolor va de 0 a 10.');
      return;
    }

    const base: Omit<Workout, 'id' | 'fromPlan' | 'planMonth' | 'planWeek'> = {
      date: form.date,
      workoutType: form.workoutType,
      intensity: form.intensity,
      plannedDurationMinutes: Math.round(planned),
      actualDurationMinutes: actual !== undefined ? Math.round(actual) : null,
      loadKg: Math.max(0, Number(form.loadKg) || 0),
      distanceKm: parseOptionalNumber(form.distanceKm),
      effortRpe: rpe,
      painLevel: pain,
      notes: form.notes.trim(),
      status: form.status,
    };

    if (editing) {
      updateWorkout(editing.id, base);
      setSavedId(editing.id);
    } else {
      const id = createId('w');
      addWorkout({ ...base, id, fromPlan: false });
      setSavedId(id);
      setForm(toForm(null));
    }
  };

  const savedWorkout = savedId ? data.workouts.find((w) => w.id === savedId) ?? null : null;
  const savedPainAlert = savedWorkout ? painAlert(savedWorkout) : null;
  const savedProgressionAlert = savedId ? progressionAlert(data.workouts) : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title={editing ? 'Editar entrenamiento' : 'Registrar entrenamiento'}
        subtitle="La duracion es la metrica principal. Distancia y velocidad son opcionales."
        action={
          <Link to="/calendario" className="text-sm font-semibold text-bosque">
            Ver calendario
          </Link>
        }
      />

      {painPreview && (
        <AlertBanner
          alert={{
            id: 'pain-preview',
            level: 'alerta',
            title: 'Dolor de 5/10 o mas',
            message:
              'Para la salida, descansa y no fuerces. Si el dolor sigue varios dias, consulta a un profesional de la salud.',
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card title="Datos principales">
          <div className="space-y-3">
            <div>
              <label className="etiqueta" htmlFor="f-date">
                Fecha
              </label>
              <input
                id="f-date"
                type="date"
                className="campo"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="etiqueta" htmlFor="f-type">
                  Tipo
                </label>
                <select
                  id="f-type"
                  className="campo"
                  value={form.workoutType}
                  onChange={(e) => set('workoutType', e.target.value as WorkoutType)}
                >
                  {WORKOUT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {WORKOUT_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="etiqueta" htmlFor="f-intensity">
                  Intensidad
                </label>
                <select
                  id="f-intensity"
                  className="campo"
                  value={form.intensity}
                  onChange={(e) => set('intensity', e.target.value as Intensity)}
                >
                  {INTENSITIES.map((i) => (
                    <option key={i} value={i}>
                      {INTENSITY_LABEL[i]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="etiqueta" htmlFor="f-planned">
                  Duracion prevista (min)
                </label>
                <input
                  id="f-planned"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="campo"
                  value={form.plannedDurationMinutes}
                  onChange={(e) => set('plannedDurationMinutes', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="etiqueta" htmlFor="f-actual">
                  Duracion real (min)
                </label>
                <input
                  id="f-actual"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="campo"
                  value={form.actualDurationMinutes}
                  onChange={(e) => set('actualDurationMinutes', e.target.value)}
                  placeholder="p. ej. 58"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="etiqueta" htmlFor="f-load">
                  Equipaje (kg)
                </label>
                <input
                  id="f-load"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.5}
                  className="campo"
                  value={form.loadKg}
                  onChange={(e) => set('loadKg', e.target.value)}
                />
              </div>
              <div>
                <label className="etiqueta" htmlFor="f-status">
                  Estado
                </label>
                <select
                  id="f-status"
                  className="campo"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as WorkoutStatus)}
                >
                  {(['completed', 'partial', 'planned', 'skipped'] as WorkoutStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Sensaciones y recuperacion">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="etiqueta" htmlFor="f-rpe">
                Esfuerzo percibido (1-10)
              </label>
              <input
                id="f-rpe"
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                className="campo"
                value={form.effortRpe}
                onChange={(e) => set('effortRpe', e.target.value)}
                placeholder="opcional"
              />
            </div>
            <div>
              <label className="etiqueta" htmlFor="f-pain">
                Dolor (0-10)
              </label>
              <input
                id="f-pain"
                type="number"
                inputMode="numeric"
                min={0}
                max={10}
                className="campo"
                value={form.painLevel}
                onChange={(e) => set('painLevel', e.target.value)}
                placeholder="opcional"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="etiqueta" htmlFor="f-notes">
              Notas
            </label>
            <textarea
              id="f-notes"
              className="campo min-h-[88px]"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Como te sentiste, terreno, comida, ropa..."
            />
          </div>
        </Card>

        <Card title="Metricas secundarias (opcionales)">
          <p className="mb-2 text-sm text-texto-suave">
            La distancia y la velocidad no son el objetivo. Registralas solo si te sirven.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="etiqueta" htmlFor="f-distance">
                Distancia (km)
              </label>
              <input
                id="f-distance"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                className="campo"
                value={form.distanceKm}
                onChange={(e) => set('distanceKm', e.target.value)}
                placeholder="opcional"
              />
            </div>
            <div className="flex items-end">
              <p className="text-sm text-texto-suave">
                {parseOptionalNumber(form.distanceKm) !== undefined &&
                parseOptionalNumber(form.actualDurationMinutes) !== undefined &&
                (parseOptionalNumber(form.actualDurationMinutes) as number) > 0
                  ? `Ritmo aprox.: ${(
                      ((parseOptionalNumber(form.distanceKm) as number) /
                        (parseOptionalNumber(form.actualDurationMinutes) as number)) *
                      60
                    ).toFixed(1)} km/h`
                  : 'Sin ritmo calculado.'}
              </p>
            </div>
          </div>
        </Card>

        {error && (
          <p role="alert" className="rounded-xl bg-alerta-suave p-3 text-sm font-semibold text-alerta">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="boton-primario">
            {editing ? 'Guardar cambios' : 'Anadir entrenamiento'}
          </button>
          {editing && !editing.fromPlan && (
            <ConfirmButton
              label="Eliminar"
              question="Eliminar este entrenamiento del historial?"
              confirmLabel="Si, eliminar"
              onConfirm={() => {
                deleteWorkout(editing.id);
                navigate('/calendario');
              }}
            />
          )}
        </div>
      </form>

      {savedId && (
        <Card title="Guardado">
          <p className="text-sm text-texto-suave">
            Entrenamiento guardado. Revisa tu progreso o vuelve al inicio.
          </p>
          {savedPainAlert && (
            <div className="mt-3">
              <AlertBanner alert={savedPainAlert} />
            </div>
          )}
          {savedProgressionAlert && (
            <div className="mt-3">
              <AlertBanner alert={savedProgressionAlert} />
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Link to="/progreso" className="boton-secundario">
              Ver progreso
            </Link>
            <Link to="/" className="boton-secundario">
              Volver a Hoy
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
