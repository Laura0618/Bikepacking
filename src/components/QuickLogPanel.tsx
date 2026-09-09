import { useState } from 'react';
import { Stepper } from './ui/Stepper';
import { EFFORT_ANCHORS, PAIN_ANCHORS, effortAnchorText } from '../lib/labels';
import type { Workout } from '../types';

interface QuickLogPanelProps {
  workout: Workout;
  onSave: (patch: Partial<Workout>) => void;
  onCancel: () => void;
}

/** Panel de registro rapido (~15 s): duracion, dolor, esfuerzo y nota opcional. */
export function QuickLogPanel({ workout, onSave, onCancel }: QuickLogPanelProps): JSX.Element {
  const [minutes, setMinutes] = useState<number>(
    workout.actualDurationMinutes ?? workout.plannedDurationMinutes,
  );
  const [pain, setPain] = useState<number | null>(workout.painLevel ?? null);
  const [rpe, setRpe] = useState<number | null>(workout.effortRpe ?? null);
  const [note, setNote] = useState<string>('');

  const submit = (): void => {
    onSave({
      status: 'completed',
      actualDurationMinutes: Math.round(minutes),
      painLevel: pain ?? undefined,
      effortRpe: rpe ?? undefined,
      notes: note.trim() ? (workout.notes ? `${workout.notes}\n${note.trim()}` : note.trim()) : workout.notes,
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-bosque bg-bosque-suave/40 p-4">
      <p className="text-sm font-semibold text-bosque-oscuro">Registro rapido</p>

      <Stepper
        id="q-dur"
        label="Minutos que rodaste"
        value={minutes}
        onChange={setMinutes}
        step={5}
      />

      <div>
        <span className="etiqueta">Dolor</span>
        <div className="flex flex-wrap gap-2">
          {PAIN_ANCHORS.map((a) => (
            <button
              key={a.value}
              type="button"
              aria-pressed={pain === a.value}
              onClick={() => setPain(pain === a.value ? null : a.value)}
              className={`min-h-touch rounded-xl border px-3 text-sm font-semibold ${
                pain === a.value
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
      </div>

      <div>
        <span className="etiqueta">Esfuerzo (opcional)</span>
        <div className="flex flex-wrap gap-2">
          {EFFORT_ANCHORS.map((a) => (
            <button
              key={a.value}
              type="button"
              aria-pressed={rpe === a.value}
              onClick={() => setRpe(rpe === a.value ? null : a.value)}
              className={`min-h-touch rounded-xl border px-3 text-sm font-semibold ${
                rpe === a.value
                  ? 'border-bosque bg-bosque text-white'
                  : 'border-bosque-suave bg-superficie text-texto-suave'
              }`}
            >
              {effortAnchorText(a.value)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="etiqueta" htmlFor="q-note">
          Nota (opcional)
        </label>
        <textarea
          id="q-note"
          className="campo min-h-[64px]"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Sillin, rodillas, espalda, energia..."
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="boton-primario" onClick={submit}>
          Guardar salida
        </button>
        <button type="button" className="boton-secundario" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
