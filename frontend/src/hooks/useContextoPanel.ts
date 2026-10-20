import { useOutletContext } from 'react-router-dom';

export interface ContextoPanel {
  // Sucursal sobre la que se está trabajando (null mientras carga)
  sucursalId: number | null;
}

export function useContextoPanel() {
  return useOutletContext<ContextoPanel>();
}
