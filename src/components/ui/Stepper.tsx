interface StepperProps {
  id?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}

export function Stepper({
  id,
  label,
  value,
  onChange,
  step = 5,
  min = 0,
  max = 600,
  suffix = 'min',
}: StepperProps): JSX.Element {
  const clamp = (n: number): number => Math.min(max, Math.max(min, n));
  return (
    <div>
      <label className="etiqueta" htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="boton-secundario px-0 text-xl"
          style={{ minWidth: 44, minHeight: 44 }}
          onClick={() => onChange(clamp(value - step))}
          aria-label={`Restar ${step} ${suffix}`}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          className="campo text-center"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
        />
        <button
          type="button"
          className="boton-secundario px-0 text-xl"
          style={{ minWidth: 44, minHeight: 44 }}
          onClick={() => onChange(clamp(value + step))}
          aria-label={`Sumar ${step} ${suffix}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
