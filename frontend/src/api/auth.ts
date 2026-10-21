import { isAxiosError } from 'axios';
import { api } from './cliente';
import type { UsuarioSesion } from './tipos';

export async function iniciarSesion(usuario: string, password: string): Promise<void> {
  await api.post('/auth/login', { usuario, password });
}

export async function cerrarSesion(): Promise<void> {
  await api.post('/auth/logout');
}

// Devuelve el usuario, o null si no hay sesión (401).
// Cualquier otro error sí se lanza: no es lo mismo "no has entrado" que "la API se cayó".
export async function obtenerSesionActual(): Promise<UsuarioSesion | null> {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 401) return null;
    throw e;
  }
}

export async function cambiarMiClave(actual: string, nueva: string): Promise<void> {
  await api.put('/auth/password', { actual, nueva });
}
