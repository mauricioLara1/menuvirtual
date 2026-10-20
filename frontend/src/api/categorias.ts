import { api } from './cliente';
import type { Categoria } from './tipos';

export async function listarCategorias(): Promise<Categoria[]> {
  const { data } = await api.get('/categorias');
  return data;
}
