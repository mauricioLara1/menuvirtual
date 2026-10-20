import { pool } from '../config/db';

export interface UsuarioSesion {
  id: number;
  usuario: string;
  rol: string;
  sucursal_id: number | null;
}

export async function buscarParaLogin(usuario: string) {
  const { rows } = await pool.query(
    `SELECT u.id, u.usuario, u.password_hash, r.nombre AS rol, u.sucursal_id
       FROM usuario u
       JOIN rol r ON r.id = u.rol_id
      WHERE u.usuario = $1 AND u.activo = true AND r.activo = true`,
    [usuario]
  );
  return (rows[0] as (UsuarioSesion & { password_hash: string }) | undefined) ?? null;
}

export async function obtenerSesion(id: number): Promise<UsuarioSesion | null> {
  const { rows } = await pool.query(
    `SELECT u.id, u.usuario, r.nombre AS rol, u.sucursal_id
       FROM usuario u
       JOIN rol r ON r.id = u.rol_id
      WHERE u.id = $1 AND u.activo = true AND r.activo = true`,
    [id]
  );
  return rows[0] ?? null;
}
