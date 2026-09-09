import { useRef, useState } from 'react';
import { useAppData } from '../store/AppDataProvider';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfirmButton } from '../components/ui/ConfirmButton';
import { WEEKDAY_LABELS } from '../lib/labels';
import { todayISO } from '../lib/dates';
import type { Units, WeekdayIndex } from '../types';

export function AjustesPage(): JSX.Element {
  const { data, updateSettings, regeneratePlan, resetAll, exportJSON, importJSON } = useAppData();
  const { settings } = data;
  const fileRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const toggleDay = (day: WeekdayIndex): void => {
    const has = settings.preferredTrainingDays.includes(day);
    const next = has
      ? settings.preferredTrainingDays.filter((d) => d !== day)
      : [...settings.preferredTrainingDays, day].sort((a, b) => a - b);
    updateSettings({ preferredTrainingDays: next });
  };

  const handleDownload = (): void => {
    try {
      const blob = new Blob([exportJSON()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pedalea-a-polonia-${todayISO()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage({ tone: 'ok', text: 'Datos exportados como archivo JSON.' });
    } catch {
      setMessage({ tone: 'error', text: 'No se pudo generar la descarga.' });
    }
  };

  const handleImportText = (text: string): void => {
    try {
      importJSON(text);
      setMessage({ tone: 'ok', text: 'Datos importados correctamente.' });
      setImportText('');
    } catch (error) {
      setMessage({
        tone: 'error',
        text: `No se pudo importar: ${error instanceof Error ? error.message : 'archivo invalido'}.`,
      });
    }
  };

  const handleFile = (file: File): void => {
    const reader = new FileReader();
    reader.onload = () => handleImportText(String(reader.result));
    reader.onerror = () => setMessage({ tone: 'error', text: 'No se pudo leer el archivo.' });
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Ajustes" subtitle="Configuracion, copia de seguridad y reinicio." />

      {message && (
        <p
          role="status"
          className={`rounded-xl p-3 text-sm font-semibold ${
            message.tone === 'ok'
              ? 'bg-bosque-suave text-bosque-oscuro'
              : 'bg-alerta-suave text-alerta'
          }`}
        >
          {message.text}
        </p>
      )}

      <Card title="Fechas y preferencias">
        <div className="space-y-3">
          <div>
            <label className="etiqueta" htmlFor="s-start">
              Fecha de inicio del plan
            </label>
            <input
              id="s-start"
              type="date"
              className="campo"
              value={settings.startDate}
              onChange={(e) => e.target.value && updateSettings({ startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="s-trip">
              Fecha del viaje
            </label>
            <input
              id="s-trip"
              type="date"
              className="campo"
              value={settings.tripDate}
              onChange={(e) => e.target.value && updateSettings({ tripDate: e.target.value })}
            />
          </div>
          <div>
            <span className="etiqueta">Dias preferidos de entrenamiento</span>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((label, index) => {
                const day = index as WeekdayIndex;
                const active = settings.preferredTrainingDays.includes(day);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleDay(day)}
                    aria-pressed={active}
                    className={`min-h-touch rounded-xl border px-3 text-sm font-semibold ${
                      active
                        ? 'border-bosque bg-bosque text-white'
                        : 'border-bosque-suave bg-superficie text-texto-suave'
                    }`}
                  >
                    {label.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="etiqueta" htmlFor="s-units">
              Unidades de distancia
            </label>
            <select
              id="s-units"
              className="campo"
              value={settings.units}
              onChange={(e) => updateSettings({ units: e.target.value as Units })}
            >
              <option value="metric">Kilometros</option>
              <option value="imperial">Millas</option>
            </select>
          </div>
        </div>
      </Card>

      <Card title="Plan de seis meses">
        <p className="text-sm text-texto-suave">
          Regenerar recrea las 24 semanas a partir de la fecha de inicio. Se conservan los
          entrenamientos y sesiones de fuerza que hayas creado a mano.
        </p>
        <p className="mt-1 text-xs text-texto-suave">
          Ultima generacion:{' '}
          {data.planGeneratedAt
            ? new Date(data.planGeneratedAt).toLocaleString('es-ES')
            : 'nunca'}
        </p>
        <button
          type="button"
          className="boton-primario mt-3"
          onClick={() => {
            regeneratePlan();
            setMessage({ tone: 'ok', text: 'Plan regenerado.' });
          }}
        >
          Regenerar plan
        </button>
      </Card>

      <Card title="Exportar datos">
        <p className="text-sm text-texto-suave">
          Descarga una copia de seguridad en JSON con ajustes, entrenamientos, fuerza e hitos.
        </p>
        <button type="button" className="boton-secundario mt-3" onClick={handleDownload}>
          Descargar JSON
        </button>
      </Card>

      <Card title="Importar datos">
        <p className="text-sm text-texto-suave">
          Sustituye todos los datos actuales por los del archivo. Haz antes una exportacion.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="mt-3 block w-full text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
        <div className="mt-3">
          <label className="etiqueta" htmlFor="s-import-text">
            O pega el contenido JSON
          </label>
          <textarea
            id="s-import-text"
            className="campo min-h-[96px] font-mono text-xs"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"version":1,"settings":{...}}'
          />
          <button
            type="button"
            className="boton-secundario mt-2"
            disabled={importText.trim() === ''}
            onClick={() => handleImportText(importText)}
          >
            Importar desde texto
          </button>
        </div>
      </Card>

      <Card title="Zona de riesgo">
        <p className="text-sm text-texto-suave">
          Borra todos los datos guardados en este navegador y vuelve a cargar el plan inicial.
        </p>
        <div className="mt-3">
          <ConfirmButton
            label="Reiniciar todos los datos"
            question="Se borraran entrenamientos, fuerza, hitos y ajustes de este navegador. Continuar?"
            confirmLabel="Si, reiniciar"
            onConfirm={() => {
              resetAll();
              setMessage({ tone: 'ok', text: 'Datos reiniciados al plan inicial.' });
            }}
          />
        </div>
      </Card>
    </div>
  );
}
