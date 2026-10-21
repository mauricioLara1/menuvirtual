import { api } from './cliente';
import type { Categoria } from './tipos';

export type CategoriaConOrden = Categoria & { orden: number };

export interface DatosCategoria {
  nombre: string;
  orden?: number;
}

export async function listarCategorias(): Promise<CategoriaConOrden[]> {
  const { data } = await api.get('/categorias');
  return data;
}

export async function crearCategoria(datos: DatosCategoria): Promise<CategoriaConOrden> {
  const { data } = await api.post('/categorias', datos);
  return data;
}

export async function actualizarCategoria(id: number, datos: DatosCategoria): Promise<CategoriaConOrden> {
  const { data } = await api.put(`/categorias/${id}`, datos);
  return data;
}

export async function eliminarCategoria(id: number): Promise<void> {
  await api.delete(`/categorias/${id}`);
}
