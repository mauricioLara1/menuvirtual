import { pool } from '../config/db';

export interface UsuarioSesion {
  id: number;
  usuario: string;
  rol: string;
  sucursal_id: number | null;
}

// Un usuario solo puede entrar si él, su rol y su sucursal (cuando tiene una) están activos.
// El OWNER no tiene sucursal (NULL), por eso el LEFT JOIN.
export async function buscarParaLogin(usuario: string) {
  const { rows } = await pool.query(
    `SELECT u.id, u.usuario, u.password_hash, r.nombre AS rol, u.sucursal_id
       FROM usuario u
       JOIN rol r ON r.id = u.rol_id
       LEFT JOIN sucursal s ON s.id = u.sucursal_id
      WHERE u.usuario = $1 AND u.activo = true AND r.activo = true
        AND (u.sucursal_id IS NULL OR s.activo = true)`,
    [usuario]
  );
  return (rows[0] as (UsuarioSesion & { password_hash: string }) | undefined) ?? null;
}

// Se consulta en cada petición: si la sucursal se desactiva, sus admins quedan fuera al instante.
export async function obtenerSesion(id: number): Promise<UsuarioSesion | null> {
  const { rows } = await pool.query(
    `SELECT u.id, u.usuario, r.nombre AS rol, u.sucursal_id
       FROM usuario u
       JOIN rol r ON r.id = u.rol_id
       LEFT JOIN sucursal s ON s.id = u.sucursal_id
      WHERE u.id = $1 AND u.activo = true AND r.activo = true
        AND (u.sucursal_id IS NULL OR s.activo = true)`,
    [id]
  );
  return rows[0] ?? null;
}
