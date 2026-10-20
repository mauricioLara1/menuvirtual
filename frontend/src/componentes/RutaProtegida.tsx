import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSesion } from '../hooks/useSesion';

interface Props {
  roles: string[];
  children: ReactNode;
}

// OJO: esto solo decide qué pantalla se ve. La seguridad real
// está en el backend, que valida cada petición.
export default function RutaProtegida({ roles, children }: Props) {
  const { data, isLoading, isError } = useSesion();

  if (isLoading) return <p className="aviso">Cargando...</p>;
  if (isError) return <p className="aviso">No pudimos verificar tu sesión.</p>;
  if (!data) return <Navigate to="/login" replace />;
  if (!roles.includes(data.rol)) {
    return <p className="aviso">No tienes permiso para ver esta página.</p>;
  }
  return <>{children}</>;
}
