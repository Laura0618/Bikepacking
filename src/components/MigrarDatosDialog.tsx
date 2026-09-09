import { useAppData } from '../store/AppDataProvider';

/** Se muestra al iniciar sesion por primera vez si hay datos locales y la cuenta esta vacia. */
export function MigrarDatosDialog(): JSX.Element | null {
  const { migrationPending, confirmMigration, declineMigration, data } = useAppData();
  if (!migrationPending) return null;

  const workouts = data.workouts.filter(
    (w) => !w.fromPlan || w.status !== 'planned' || w.actualDurationMinutes !== null,
  ).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="migrar-titulo"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-superficie p-5 shadow-lg">
        <h2 id="migrar-titulo" className="text-lg font-bold text-bosque-oscuro">
          Llevar tus datos a la cuenta
        </h2>
        <p className="mt-2 text-sm text-texto">
          Tu cuenta esta vacia y en este dispositivo hay entrenamientos y ajustes registrados
          {workouts > 0 ? ` (${workouts} salidas propias)` : ''}. Puedes copiarlos a tu cuenta para
          verlos tambien en otros dispositivos.
        </p>
        <p className="mt-2 text-sm text-texto-suave">
          Si eliges no copiarlos, seguiran aqui pero la cuenta empezara vacia y solo se
          sincronizaran los cambios nuevos. Puedes exportar una copia JSON antes desde Ajustes.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" className="boton-primario" onClick={confirmMigration}>
            Si, copiar mis datos a la cuenta
          </button>
          <button type="button" className="boton-secundario" onClick={declineMigration}>
            No, empezar la cuenta vacia
          </button>
        </div>
      </div>
    </div>
  );
}
