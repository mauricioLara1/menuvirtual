import { useOutletContext } from 'react-router-dom';

export interface ContextoPanel {
  // Sucursal sobre la que se está trabajando (null mientras carga, o si no hay ninguna)
  sucursalId: number | null;
  // true cuando ya cargó la lista y no existe ninguna sucursal (instalación nueva)
  sinSucursales: boolean;
}

export function useContextoPanel() {
  return useOutletContext<ContextoPanel>();
}
