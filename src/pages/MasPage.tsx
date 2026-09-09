import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';

const SECCIONES: { to: string; titulo: string; descripcion: string; icon: string }[] = [
  {
    to: '/fuerza',
    titulo: 'Fuerza',
    descripcion: 'Rutinas cortas y ejercicios para tolerar horas y equipaje.',
    icon: '💪',
  },
  {
    to: '/registro',
    titulo: 'Registrar entrenamiento',
    descripcion: 'Anota una salida en menos de 30 segundos.',
    icon: '📝',
  },
  {
    to: '/ajustes',
    titulo: 'Ajustes',
    descripcion: 'Fechas, dias preferidos, unidades, exportar/importar y reiniciar.',
    icon: '⚙️',
  },
];

export function MasPage(): JSX.Element {
  return (
    <div className="space-y-4">
      <PageHeader title="Mas" subtitle="Fuerza, registro y configuracion." />

      <div className="space-y-3">
        {SECCIONES.map((s) => (
          <Link key={s.to} to={s.to} className="block">
            <Card>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="text-2xl">
                  {s.icon}
                </span>
                <div>
                  <p className="font-bold text-texto">{s.titulo}</p>
                  <p className="text-sm text-texto-suave">{s.descripcion}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card title="Como usar la app">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-texto-suave">
          <li>Abre <strong>Hoy</strong> y mira la sesion recomendada y su motivo.</li>
          <li>Sal a rodar. Si tienes poco tiempo, usa la version corta.</li>
          <li>Al volver, pulsa <strong>Registrar salida</strong> y confirma en unos segundos.</li>
          <li>Revisa <strong>Progreso</strong> una vez por semana para ver que falta practicar.</li>
        </ol>
      </Card>

      <Card title="Privacidad">
        <p className="text-sm text-texto-suave">
          Todos los datos se guardan solo en este navegador (localStorage). No hay cuenta, ni
          servidor, ni envio de tu ubicacion. Exporta una copia desde Ajustes si cambias de
          dispositivo.
        </p>
      </Card>

      <Card title="Descargo">
        <p className="text-sm text-texto-suave">
          Esta aplicacion es una herramienta de organizacion, no un consejo medico ni de
          entrenamiento personalizado. Ante dolor persistente o dudas de salud, consulta a un
          profesional.
        </p>
      </Card>
    </div>
  );
}
