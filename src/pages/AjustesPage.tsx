import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppData } from '../store/AppDataProvider';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfirmButton } from '../components/ui/ConfirmButton';
import { WEEKDAY_LABELS } from '../lib/labels';
import { todayISO } from '../lib/dates';
import type { Units, WeekdayIndex } from '../types';

const SYNC_STATUS_TEXT: Record<string, string> = {
  signed_out: 'Sin cuenta',
  synced: 'Sincronizado',
  saving: 'Guardando...',
  pending: 'Pendiente de sincronizar',
  offline: 'Sin conexion',
  error: 'Error al sincronizar',
};

export function AjustesPage(): JSX.Element {
  const {
    data,
    updateSettings,
    regeneratePlan,
    resetAll,
    exportJSON,
    importJSON,
    authStatus,
    user,
    oauthConfigured,
    syncStatus,
    lastSyncAt,
    signIn,
    signOut,
    syncNow,
  } = useAppData();
  const { settings } = data;
  const fileRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const login = params.get('login');
    if (!login) return;
    setMessage(
      login === 'ok'
        ? { tone: 'ok', text: 'Sesion iniciada. Tus datos se sincronizaran con la cuenta.' }
        : { tone: 'error', text: 'No se pudo iniciar sesion. Intentalo de nuevo.' },
    );
    params.delete('login');
    setParams(params, { replace: true });
  }, [params, setParams]);

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

      <Card title="Cuenta y sincronizacion">
        {authStatus === 'loading' && (
          <p className="text-sm text-texto-suave">Comprobando la sesion...</p>
        )}

        {authStatus === 'signed_out' && (
          <div className="space-y-3">
            <p className="text-sm text-texto-suave">
              Sin cuenta, tus datos viven solo en este navegador. Inicia sesion con Google para
              guardarlos y verlos en el movil y en el ordenador.
            </p>
            {oauthConfigured ? (
              <button type="button" className="boton-primario" onClick={signIn}>
                Entrar con Google
              </button>
            ) : (
              <p className="rounded-xl bg-alerta-suave p-3 text-sm text-alerta">
                El inicio de sesion no esta configurado en este despliegue todavia. La app funciona
                igual en modo local. Ver el README para activar Google OAuth y D1.
              </p>
            )}
          </div>
        )}

        {authStatus === 'signed_in' && user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  className="h-10 w-10 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-bosque-suave text-bosque-oscuro"
                >
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-texto">{user.name}</p>
                <p className="truncate text-sm text-texto-suave">{user.email}</p>
              </div>
            </div>
            <dl className="text-sm text-texto-suave">
              <div className="flex justify-between gap-2">
                <dt>Estado</dt>
                <dd className="font-semibold text-texto">
                  {SYNC_STATUS_TEXT[syncStatus] ?? syncStatus}
                </dd>
              </div>
              <div className="mt-1 flex justify-between gap-2">
                <dt>Ultima sincronizacion</dt>
                <dd className="font-semibold text-texto">
                  {lastSyncAt ? new Date(lastSyncAt).toLocaleString('es-ES') : 'nunca'}
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="boton-secundario" onClick={syncNow}>
                Sincronizar ahora
              </button>
              <button
                type="button"
                className="boton-secundario"
                onClick={() => {
                  void signOut();
                }}
              >
                Cerrar sesion
              </button>
            </div>
            <p className="text-xs text-texto-suave">
              Al cerrar sesion, los datos siguen en este dispositivo pero dejan de sincronizarse.
            </p>
          </div>
        )}
      </Card>

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
