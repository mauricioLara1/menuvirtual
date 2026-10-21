import { pool, type Db } from '../config/db';
import { HOY_SQL } from '../config/fechas';

export interface Descuento {
  id: number;
  sucursal_id: number;
  nombre: string;
  tipo: 'PORCENTAJE' | 'VALOR_FIJO';
  valor: number;
  fecha_inicio: string; // AAAA-MM-DD
  fecha_fin: string;
  estado: 'PROGRAMADO' | 'VIGENTE' | 'VENCIDO';
  producto_ids: number[];
}

export interface DatosDescuento {
  sucursal_id: number;
  nombre: string;
  tipo: 'PORCENTAJE' | 'VALOR_FIJO';
  valor: number;
  fecha_inicio: string;
  fecha_fin: string;
  producto_ids: number[];
}

// Fechas como texto (::text) para que pg no las convierta a Date y se corra un día.
// Solo cuenta productos activos.
const SELECT = `
  SELECT d.id, d.sucursal_id, d.nombre, d.tipo, d.valor::float8 AS valor,
         d.fecha_inicio::text AS fecha_inicio, d.fecha_fin::text AS fecha_fin,
         CASE WHEN ${HOY_SQL} < d.fecha_inicio THEN 'PROGRAMADO'
              WHEN ${HOY_SQL} > d.fecha_fin THEN 'VENCIDO'
              ELSE 'VIGENTE' END AS estado,
         COALESCE(array_agg(pr.id ORDER BY pr.id) FILTER (WHERE pr.id IS NOT NULL), '{}') AS producto_ids
  FROM descuento d
  LEFT JOIN descuento_producto dp ON dp.descuento_id = d.id
  LEFT JOIN producto pr ON pr.id = dp.producto_id AND pr.activo = true`;

export async function listarPorSucursal(sucursalId: number, db: Db = pool): Promise<Descuento[]> {
  const r = await db.query(
    `${SELECT} WHERE d.sucursal_id = $1 AND d.activo = true GROUP BY d.id ORDER BY d.fecha_fin DESC, d.id DESC`,
    [sucursalId],
  );
  return r.rows;
}

export async function obtener(id: number, db: Db = pool): Promise<Descuento | null> {
  const r = await db.query(`${SELECT} WHERE d.id = $1 AND d.activo = true GROUP BY d.id`, [id]);
  return r.rows[0] ?? null;
}

// Cuántos de esos productos existen, están activos y son de esa sucursal
export async function contarProductosValidos(ids: number[], sucursalId: number, db: Db = pool): Promise<number> {
  const r = await db.query(
    'SELECT count(*)::int AS n FROM producto WHERE id = ANY($1::int[]) AND sucursal_id = $2 AND activo = true',
    [ids, sucursalId],
  );
  return r.rows[0].n;
}

async function reemplazarProductos(db: Db, descuentoId: number, ids: number[]): Promise<void> {
  await db.query('DELETE FROM descuento_producto WHERE descuento_id = $1', [descuentoId]);
  await db.query(
    'INSERT INTO descuento_producto (descuento_id, producto_id) SELECT $1, unnest($2::int[])',
    [descuentoId, ids],
  );
}

export async function crear(db: Db, d: DatosDescuento): Promise<number> {
  const r = await db.query(
    `INSERT INTO descuento (sucursal_id, nombre, tipo, valor, fecha_inicio, fecha_fin)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [d.sucursal_id, d.nombre, d.tipo, d.valor, d.fecha_inicio, d.fecha_fin],
  );
  const id: number = r.rows[0].id;
  await reemplazarProductos(db, id, d.producto_ids);
  return id;
}

export async function actualizar(db: Db, id: number, d: Omit<DatosDescuento, 'sucursal_id'>): Promise<boolean> {
  const r = await db.query(
    `UPDATE descuento SET nombre = $2, tipo = $3, valor = $4, fecha_inicio = $5, fecha_fin = $6
     WHERE id = $1 AND activo = true`,
    [id, d.nombre, d.tipo, d.valor, d.fecha_inicio, d.fecha_fin],
  );
  if ((r.rowCount ?? 0) === 0) return false;
  await reemplazarProductos(db, id, d.producto_ids);
  return true;
}

export async function desactivar(db: Db, id: number): Promise<boolean> {
  const r = await db.query('UPDATE descuento SET activo = false WHERE id = $1 AND activo = true', [id]);
  return (r.rowCount ?? 0) > 0;
}
