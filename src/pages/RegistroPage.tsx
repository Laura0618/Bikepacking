import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppData } from '../store/AppDataProvider';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { AlertBanner } from '../components/ui/AlertBanner';
import { ConfirmButton } from '../components/ui/ConfirmButton';
import { Stepper } from '../components/ui/Stepper';
import { painAlert, progressionAlert } from '../lib/alerts';
import { postLogObservation } from '../lib/coaching';
import { formatMinutes, todayISO } from '../lib/dates';
import { createId } from '../lib/id';
import {
  effortAnchorText,
  INTENSITIES,
  INTENSITY_LABEL,
  PAIN_ANCHORS,
  STATUS_LABEL,
  WORKOUT_TYPES,
  WORKOUT_TYPE_LABEL,
} from '../lib/labels';
import type { Intensity, Workout, WorkoutStatus, WorkoutType } from '../types';

interface FormState {
  date: string;
  workoutType: WorkoutType;
  intensity: Intensity;
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
  loadKg: number;
  sinCarga: boolean;
  distanceKm: string;
  effortRpe: number | null;
  painLevel: number | null;
  notes: string;
  status: WorkoutStatus;
}

function toForm(w: Workout | null): FormState {
  const planned = w ? w.plannedDurationMinutes : 60;
  return {
    date: w?.date ?? todayISO(),
    workoutType: w?.workoutType ?? 'suave',
    intensity: w?.intensity ?? 'suave',
    plannedDurationMinutes: planned,
    actualDurationMinutes: w?.actualDurationMinutes ?? planned,
    loadKg: w?.loadKg ?? 0,
    sinCarga: (w?.loadKg ?? 0) === 0,
    distanceKm: w?.distanceKm != null ? String(w.distanceKm) : '',
    effortRpe: w?.effortRpe ?? null,
    painLevel: w?.painLevel ?? null,
    notes: w?.notes ?? '',
    status: w?.status ?? 'completed',
  };
}

const STATUS_OPTIONS: { value: WorkoutStatus; help: string }[] = [
  { value: 'completed', help: 'La hice entera' },
  { value: 'partial', help: 'La hice a medias' },
  { value: 'skipped', help: 'No pude hacerla' },
];

const NOTE_PROMPTS = ['Sillin', 'Manos / cuello', 'Espalda', 'Energia', 'Clima / ropa'];

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

  const registraDuracion = form.status === 'completed' || form.status === 'partial';
  const painPreview = form.painLevel !== null && form.painLevel >= 5;

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    setError(null);

    if (registraDuracion && form.actualDurationMinutes <= 0) {
      setError('Indica cuantos minutos rodaste para marcar la salida como hecha o parcial.');
      return;
    }
    const distance =
      form.distanceKm.trim() === '' ? undefined : Number(form.distanceKm);
    if (distance !== undefined && (!Number.isFinite(distance) || distance < 0)) {
      setError('La distancia debe ser un numero valido.');
      return;
    }

    const base: Omit<
      Workout,
      'id' | 'fromPlan' | 'planMonth' | 'planWeek' | 'updatedAt' | 'deletedAt'
    > = {
      date: form.date,
      workoutType: form.workoutType,
      intensity: form.intensity,
      plannedDurationMinutes: Math.max(0, Math.round(form.plannedDurationMinutes)),
      actualDurationMinutes: registraDuracion ? Math.round(form.actualDurationMinutes) : null,
      loadKg: form.sinCarga ? 0 : Math.max(0, form.loadKg),
      distanceKm: distance,
      effortRpe: form.effortRpe ?? undefined,
      painLevel: form.painLevel ?? undefined,
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
        subtitle="Rapido: estado, duracion y sensaciones. Lo demas es opcional."
        action={
          <Link to="/" className="text-sm font-semibold text-bosque">
            Volver a Hoy
          </Link>
        }
      />

      {painPreview && (
        <AlertBanner
          alert={{
            id: 'pain-preview',
            level: 'peligro',
            title: 'Dolor de 5/10 o mas',
            message:
              'Para la salida, descansa y no fuerces. Si el dolor sigue varios dias, consulta a un profesional de la salud.',
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card title="1 · Como fue la sesion">
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const active = form.status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set('status', opt.value)}
                  className={`min-h-touch rounded-xl border px-2 py-2 text-center text-sm font-semibold ${
                    active
                      ? 'border-bosque bg-bosque text-white'
                      : 'border-bosque-suave bg-superficie text-texto'
                  }`}
                >
                  {STATUS_LABEL[opt.value]}
                  <span className="mt-0.5 block text-xs font-normal opacity-90">{opt.help}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3">
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
        </Card>

        {registraDuracion && (
          <Card title="2 · Duracion (lo principal)">
            <Stepper
              id="f-actual"
              label="Minutos que rodaste"
              value={form.actualDurationMinutes}
              onChange={(v) => set('actualDurationMinutes', v)}
              step={5}
            />
            <p className="mt-1 text-xs text-texto-suave">
              Previsto: {formatMinutes(form.plannedDurationMinutes)}. Ajusta con − / + o escribe.
            </p>
          </Card>
        )}

        <Card title={`${registraDuracion ? '3' : '2'} · Como te sentiste`}>
          <div className="space-y-4">
            <div>
              <span className="etiqueta">Esfuerzo percibido</span>
              <div className="flex flex-wrap gap-2">
                {[2, 4, 6, 8, 10].map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={form.effortRpe === v}
                    onClick={() => set('effortRpe', form.effortRpe === v ? null : v)}
                    className={`min-h-touch rounded-xl border px-3 text-sm font-semibold ${
                      form.effortRpe === v
                        ? 'border-bosque bg-bosque text-white'
                        : 'border-bosque-suave bg-superficie text-texto-suave'
                    }`}
                  >
                    {effortAnchorText(v)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="etiqueta">Dolor</span>
              <div className="flex flex-wrap gap-2">
                {PAIN_ANCHORS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    aria-pressed={form.painLevel === a.value}
                    onClick={() => set('painLevel', form.painLevel === a.value ? null : a.value)}
                    className={`min-h-touch rounded-xl border px-3 text-sm font-semibold ${
                      form.painLevel === a.value
                        ? a.value >= 5
                          ? 'border-peligro bg-peligro text-white'
                          : 'border-bosque bg-bosque text-white'
                        : 'border-bosque-suave bg-superficie text-texto-suave'
                    }`}
                  >
                    {a.value} · {a.label}
                  </button>
                ))}
              </div>
              {form.painLevel !== null && form.painLevel >= 3 && form.painLevel < 5 && (
                <p className="mt-1 text-xs text-texto-suave">
                  Molestia moderada: repite duracion antes de subirla y vigila si vuelve.
                </p>
              )}
            </div>

            <div>
              <label className="etiqueta" htmlFor="f-notes">
                Notas
              </label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {NOTE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="rounded-full border border-bosque-suave px-2.5 py-1 text-xs text-texto-suave"
                    onClick={() =>
                      set('notes', form.notes ? `${form.notes}\n${p}: ` : `${p}: `)
                    }
                  >
                    + {p}
                  </button>
                ))}
              </div>
              <textarea
                id="f-notes"
                className="campo min-h-[88px]"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Como te sentiste, terreno, comida, ropa..."
              />
            </div>
          </div>
        </Card>

        <Card title="Equipaje y tipo">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-texto">
              <input
                type="checkbox"
                checked={form.sinCarga}
                onChange={(e) => set('sinCarga', e.target.checked)}
                className="h-5 w-5"
              />
              Sali sin carga
            </label>
            {!form.sinCarga && (
              <Stepper
                id="f-load"
                label="Equipaje (kg)"
                value={form.loadKg}
                onChange={(v) => set('loadKg', v)}
                step={1}
                min={0}
                max={30}
                suffix="kg"
              />
            )}
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
                onChange={(e) => set('plannedDurationMinutes', Number(e.target.value))}
              />
            </div>
          </div>
        </Card>

        <details className="rounded-2xl border border-bosque-suave bg-superficie p-3">
          <summary className="cursor-pointer text-sm font-semibold text-bosque">
            Metricas secundarias (opcionales)
          </summary>
          <p className="mt-2 text-sm text-texto-suave">
            La distancia y la velocidad no son el objetivo. Registralas solo si te sirven.
          </p>
          <div className="mt-3">
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
            {form.distanceKm.trim() !== '' &&
              registraDuracion &&
              form.actualDurationMinutes > 0 && (
                <p className="mt-1 text-sm text-texto-suave">
                  Ritmo aprox.:{' '}
                  {((Number(form.distanceKm) / form.actualDurationMinutes) * 60).toFixed(1)} km/h
                </p>
              )}
          </div>
        </details>

        {error && (
          <p role="alert" className="rounded-xl bg-alerta-suave p-3 text-sm font-semibold text-alerta">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="boton-primario">
            {editing ? 'Guardar cambios' : 'Guardar'}
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

      {savedWorkout && (
        <Card title="Guardado">
          <p className="text-sm text-texto">{postLogObservation(savedWorkout, data.workouts)}</p>
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
