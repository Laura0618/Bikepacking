import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';

export function NoEncontradoPage(): JSX.Element {
  return (
    <div className="space-y-4">
      <PageHeader title="Pagina no encontrada" />
      <EmptyState
        icon="🧭"
        title="Aqui no hay ruta"
        message="La direccion que buscas no existe en la aplicacion."
        action={
          <Link to="/" className="boton-primario">
            Volver al inicio
          </Link>
        }
      />
    </div>
  );
}
