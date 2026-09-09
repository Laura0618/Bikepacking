import { NavLink, Outlet, useLocation } from 'react-router-dom';

const NAV_ITEMS: { to: string; label: string; icon: string }[] = [
  { to: '/', label: 'Hoy', icon: '📍' },
  { to: '/plan', label: 'Plan', icon: '🗺️' },
  { to: '/calendario', label: 'Calendario', icon: '📅' },
  { to: '/progreso', label: 'Progreso', icon: '📈' },
  { to: '/mas', label: 'Mas', icon: '☰' },
];

function linkClass({ isActive }: { isActive: boolean }): string {
  return [
    'flex min-h-touch min-w-touch flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-xs font-semibold',
    isActive ? 'bg-bosque text-white' : 'text-texto-suave hover:bg-bosque-suave',
  ].join(' ');
}

export function Layout(): JSX.Element {
  const location = useLocation();
  const onRegistro = location.pathname.startsWith('/registro');

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 border-b border-bosque-suave bg-fondo/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="h-8 w-8" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold leading-tight text-bosque-oscuro">Pedalea a Polonia</p>
            <p className="text-xs leading-tight text-texto-suave">
              Preparacion tranquila para varios dias sobre la bici
            </p>
          </div>
        </div>
      </header>

      <main id="contenido" className="flex-1 space-y-5 px-4 py-5 pb-32">
        <Outlet />
      </main>

      {!onRegistro && (
        <NavLink
          to="/registro"
          className="fixed bottom-20 right-4 z-40 flex min-h-touch items-center gap-2 rounded-full bg-bosque px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-bosque-oscuro"
        >
          <span aria-hidden="true">📝</span>
          Registrar salida
        </NavLink>
      )}

      <nav
        aria-label="Navegacion principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-bosque-suave bg-superficie/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-2xl gap-1 px-2 py-1.5">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
              <span aria-hidden="true" className="text-base">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
