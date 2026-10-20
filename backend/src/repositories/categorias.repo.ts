import { pool, type Db } from '../config/db';
import type { CategoriaInput } from '../schemas/categorias.schema';

export async function listar(db: Db = pool) {
  const { rows } = await db.query(
    'SELECT id, nombre, orden FROM categoria WHERE activo = true ORDER BY orden, nombre'
  );
  return rows;
}

export async function obtener(id: number, db: Db = pool) {
  const { rows } = await db.query(
    'SELECT id, nombre, orden FROM categoria WHERE id = $1 AND activo = true',
    [id]
  );
  return rows[0] ?? null;
}

export async function crear(d: CategoriaInput, db: Db = pool) {
  const { rows } = await db.query(
    'INSERT INTO categoria (nombre, orden) VALUES ($1, COALESCE($2, 0)) RETURNING id',
    [d.nombre, d.orden]
  );
  return obtener(rows[0].id, db);
}

export async function actualizar(id: number, d: CategoriaInput, db: Db = pool) {
  const { rowCount } = await db.query(
    'UPDATE categoria SET nombre = $1, orden = COALESCE($2, orden) WHERE id = $3 AND activo = true',
    [d.nombre, d.orden, id]
  );
  return rowCount ? obtener(id, db) : null;
}

export async function contarProductosActivos(id: number, db: Db = pool): Promise<number> {
  const { rows } = await db.query(
    'SELECT count(*)::int AS n FROM producto WHERE categoria_id = $1 AND activo = true',
    [id]
  );
  return rows[0].n;
}

// Borrado suave
export async function desactivar(id: number, db: Db = pool) {
  const { rowCount } = await db.query(
    'UPDATE categoria SET activo = false WHERE id = $1 AND activo = true',
    [id]
  );
  return (rowCount ?? 0) > 0;
}
