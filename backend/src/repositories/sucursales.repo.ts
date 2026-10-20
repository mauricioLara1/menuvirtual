import { pool, type Db } from '../config/db';
import type { SucursalInput } from '../schemas/sucursales.schema';

export async function listar(db: Db = pool) {
  const { rows } = await db.query(
    'SELECT id, nombre, direccion FROM sucursal WHERE activo = true ORDER BY nombre'
  );
  return rows;
}

export async function obtener(id: number, db: Db = pool) {
  const { rows } = await db.query(
    'SELECT id, nombre, direccion FROM sucursal WHERE id = $1 AND activo = true',
    [id]
  );
  return rows[0] ?? null;
}

export async function crear(d: SucursalInput, db: Db = pool) {
  const { rows } = await db.query(
    'INSERT INTO sucursal (nombre, direccion) VALUES ($1, $2) RETURNING id',
    [d.nombre, d.direccion]
  );
  return obtener(rows[0].id, db);
}

export async function actualizar(id: number, d: SucursalInput, db: Db = pool) {
  const { rowCount } = await db.query(
    'UPDATE sucursal SET nombre = $1, direccion = $2 WHERE id = $3 AND activo = true',
    [d.nombre, d.direccion, id]
  );
  return rowCount ? obtener(id, db) : null;
}

// Borrado suave: la sucursal deja de mostrar su menú público
export async function desactivar(id: number, db: Db = pool) {
  const { rowCount } = await db.query(
    'UPDATE sucursal SET activo = false WHERE id = $1 AND activo = true',
    [id]
  );
  return (rowCount ?? 0) > 0;
}
