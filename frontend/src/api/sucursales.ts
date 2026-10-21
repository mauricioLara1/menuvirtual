import { api } from './cliente';
import type { Sucursal } from './tipos';

export interface DatosSucursal {
  nombre: string;
  direccion: string;
}

export async function crearSucursal(datos: DatosSucursal): Promise<Sucursal> {
  const { data } = await api.post('/sucursales', datos);
  return data;
}

export async function actualizarSucursal(id: number, datos: DatosSucursal): Promise<Sucursal> {
  const { data } = await api.put(`/sucursales/${id}`, datos);
  return data;
}

export async function eliminarSucursal(id: number): Promise<void> {
  await api.delete(`/sucursales/${id}`);
}
