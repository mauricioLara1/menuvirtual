import { api } from './cliente';

export interface UsuarioFila {
  id: number;
  usuario: string;
  rol: 'OWNER' | 'ADMIN';
  sucursal_id: number | null;
  sucursal: string | null;
}

export interface DatosCrearUsuario {
  usuario: string;
  password: string;
  rol: 'OWNER' | 'ADMIN';
  sucursal_id: number | null;
}

// Si viene password, se restablece la clave del usuario
export interface DatosEditarUsuario {
  rol: 'OWNER' | 'ADMIN';
  sucursal_id: number | null;
  password?: string;
}

export async function listarUsuarios(): Promise<UsuarioFila[]> {
  const { data } = await api.get('/usuarios');
  return data;
}

export async function crearUsuario(datos: DatosCrearUsuario): Promise<UsuarioFila> {
  const { data } = await api.post('/usuarios', datos);
  return data;
}

export async function actualizarUsuario(id: number, datos: DatosEditarUsuario): Promise<UsuarioFila> {
  const { data } = await api.put(`/usuarios/${id}`, datos);
  return data;
}

export async function eliminarUsuario(id: number): Promise<void> {
  await api.delete(`/usuarios/${id}`);
}
