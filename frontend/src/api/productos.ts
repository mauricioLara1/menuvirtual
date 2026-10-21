import { api } from './cliente';
import type { Producto } from './tipos';

export interface DatosProducto {
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  categoria_id: number;
}

export async function obtenerProducto(id: number): Promise<Producto> {
  const { data } = await api.get(`/productos/${id}`);
  return data;
}

export async function crearProducto(datos: DatosProducto & { sucursal_id: number }): Promise<Producto> {
  const { data } = await api.post('/productos', datos);
  return data;
}

export async function actualizarProducto(id: number, datos: DatosProducto): Promise<Producto> {
  const { data } = await api.put(`/productos/${id}`, datos);
  return data;
}

export async function eliminarProducto(id: number): Promise<void> {
  await api.delete(`/productos/${id}`);
}

export async function subirImagen(id: number, archivo: File): Promise<{ imagen_url: string }> {
  const formulario = new FormData();
  formulario.append('imagen', archivo);
  const { data } = await api.post(`/productos/${id}/imagen`, formulario);
  return data;
}
