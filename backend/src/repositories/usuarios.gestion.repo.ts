import { pool, type Db } from '../config/db';

export interface UsuarioFila {
  id: number;
  usuario: string;
  rol: 'OWNER' | 'ADMIN';
  sucursal_id: number | null;
  sucursal: string | null;
}

// Nunca se selecciona password_hash aquí
const SELECT = `
  SELECT u.id, u.usuario, r.nombre AS rol, u.sucursal_id, s.nombre AS sucursal
  FROM usuario u
  JOIN rol r ON r.id = u.rol_id
  LEFT JOIN sucursal s ON s.id = u.sucursal_id`;

export async function listar(db: Db = pool): Promise<UsuarioFila[]> {
  const r = await db.query(`${SELECT} WHERE u.activo = true ORDER BY r.nombre DESC, u.usuario`);
  return r.rows;
}

export async function obtener(id: number, db: Db = pool): Promise<UsuarioFila | null> {
  const r = await db.query(`${SELECT} WHERE u.id = $1 AND u.activo = true`, [id]);
  return r.rows[0] ?? null;
}

export async function obtenerHash(id: number, db: Db = pool): Promise<string | null> {
  const r = await db.query('SELECT password_hash FROM usuario WHERE id = $1 AND activo = true', [id]);
  return r.rows[0]?.password_hash ?? null;
}

export async function sucursalActiva(id: number, db: Db = pool): Promise<boolean> {
  const r = await db.query('SELECT 1 FROM sucursal WHERE id = $1 AND activo = true', [id]);
  return (r.rowCount ?? 0) > 0;
}

export async function contarOwnersActivos(db: Db = pool): Promise<number> {
  const r = await db.query(
    `SELECT count(*)::int AS n FROM usuario u JOIN rol r ON r.id = u.rol_id
     WHERE r.nombre = 'OWNER' AND u.activo = true`,
  );
  return r.rows[0].n;
}

export async function crear(
  db: Db,
  d: { usuario: string; password_hash: string; rol: string; sucursal_id: number | null },
): Promise<number> {
  const r = await db.query(
    `INSERT INTO usuario (usuario, password_hash, rol_id, sucursal_id)
     VALUES ($1, $2, (SELECT id FROM rol WHERE nombre = $3), $4) RETURNING id`,
    [d.usuario, d.password_hash, d.rol, d.sucursal_id],
  );
  return r.rows[0].id;
}

export async function actualizar(db: Db, id: number, rol: string, sucursalId: number | null): Promise<void> {
  await db.query(
    `UPDATE usuario SET rol_id = (SELECT id FROM rol WHERE nombre = $2), sucursal_id = $3
     WHERE id = $1 AND activo = true`,
    [id, rol, sucursalId],
  );
}

export async function cambiarClave(db: Db, id: number, hash: string): Promise<void> {
  await db.query('UPDATE usuario SET password_hash = $2 WHERE id = $1 AND activo = true', [id, hash]);
}

export async function desactivar(db: Db, id: number): Promise<boolean> {
  const r = await db.query('UPDATE usuario SET activo = false WHERE id = $1 AND activo = true', [id]);
  return (r.rowCount ?? 0) > 0;
}
