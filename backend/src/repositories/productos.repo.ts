import { pool } from '../config/db';
import type { ProductoInput, ProductoUpdateInput } from '../schemas/productos.schema';

// pg devuelve NUMERIC como texto; ::float8 lo entrega como número
const COLUMNAS = `p.id, p.nombre, p.descripcion, p.precio::float8 AS precio,
  p.imagen_url, p.categoria_id, c.nombre AS categoria, p.sucursal_id`;

export async function listarPorSucursal(sucursalId: number) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS}
       FROM producto p
       JOIN categoria c ON c.id = p.categoria_id
      WHERE p.sucursal_id = $1 AND p.activo = true
      ORDER BY c.nombre, p.nombre`,
    [sucursalId]
  );
  return rows;
}

export async function obtener(id: number) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS}
       FROM producto p
       JOIN categoria c ON c.id = p.categoria_id
      WHERE p.id = $1 AND p.activo = true`,
    [id]
  );
  return rows[0] ?? null;
}

export async function crear(d: ProductoInput) {
  const { rows } = await pool.query(
    `INSERT INTO producto (nombre, descripcion, precio, imagen_url, categoria_id, sucursal_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [d.nombre, d.descripcion, d.precio, d.imagen_url, d.categoria_id, d.sucursal_id]
  );
  return obtener(rows[0].id);
}

export async function actualizar(id: number, d: ProductoUpdateInput) {
  const { rowCount } = await pool.query(
    `UPDATE producto
        SET nombre = $1, descripcion = $2, precio = $3,
            imagen_url = $4, categoria_id = $5, updated_at = now()
      WHERE id = $6 AND activo = true`,
    [d.nombre, d.descripcion, d.precio, d.imagen_url, d.categoria_id, id]
  );
  return rowCount ? obtener(id) : null;
}

// Borrado suave: no elimina la fila, solo la apaga
export async function desactivar(id: number) {
  const { rowCount } = await pool.query(
    `UPDATE producto SET activo = false, updated_at = now()
      WHERE id = $1 AND activo = true`,
    [id]
  );
  return (rowCount ?? 0) > 0;
}
