import { api } from './cliente';
import type { Producto, Sucursal } from './tipos';

export async function listarSucursales(): Promise<Sucursal[]> {
  const { data } = await api.get('/sucursales');
  return data;
}

export async function obtenerSucursal(id: number): Promise<Sucursal> {
  const { data } = await api.get(`/sucursales/${id}`);
  return data;
}

export async function listarProductos(sucursalId: number): Promise<Producto[]> {
  const { data } = await api.get(`/sucursales/${sucursalId}/productos`);
  return data;
}
