import { useState } from 'react';

interface ConfirmButtonProps {
  label: string;
  confirmLabel?: string;
  question?: string;
  onConfirm: () => void;
  className?: string;
}

export function ConfirmButton({
  label,
  confirmLabel = 'Si, continuar',
  question = 'Esta accion no se puede deshacer. Continuar?',
  onConfirm,
  className = 'boton-peligro',
}: ConfirmButtonProps): JSX.Element {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-alerta-claro bg-alerta-suave p-3">
      <p className="text-sm font-semibold text-texto">{question}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="boton-peligro"
          onClick={() => {
            onConfirm();
            setOpen(false);
          }}
        >
          {confirmLabel}
        </button>
        <button type="button" className="boton-secundario" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
