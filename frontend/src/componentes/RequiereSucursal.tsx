import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useContextoPanel } from '../hooks/useContextoPanel';

// Envuelve las pantallas que trabajan sobre una sucursal (productos, descuentos).
export default function RequiereSucursal({ children }: { children: ReactNode }) {
  const { sinSucursales } = useContextoPanel();
  if (sinSucursales) {
    return (
      <p className="aviso">
        Aún no hay sucursales. <Link to="/admin/sucursales">Crea la primera</Link> para empezar.
      </p>
    );
  }
  return <>{children}</>;
}
