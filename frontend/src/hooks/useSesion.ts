import { useQuery } from '@tanstack/react-query';
import { obtenerSesionActual } from '../api/auth';

export function useSesion() {
  return useQuery({
    queryKey: ['me'],
    queryFn: obtenerSesionActual,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
