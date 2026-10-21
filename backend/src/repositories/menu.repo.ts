import { pool, type Db } from '../config/db';
import { HOY_SQL } from '../config/fechas';

export interface ProductoMenu {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precio_final: number;
  imagen_url: string | null;
  categoria_id: number;
  categoria: string;
  sucursal_id: number;
  descuento: { nombre: string; tipo: 'PORCENTAJE' | 'VALOR_FIJO'; valor: number } | null;
}

// Para cada producto, LATERAL elige el descuento vigente que deja el precio más bajo.
// No se suman descuentos. El precio final nunca se guarda: se calcula aquí.
export async function listarMenu(sucursalId: number, db: Db = pool): Promise<ProductoMenu[]> {
  const r = await db.query(
    `SELECT p.id, p.nombre, p.descripcion, p.precio::float8 AS precio, p.imagen_url,
            p.categoria_id, c.nombre AS categoria, p.sucursal_id,
            COALESCE(x.precio_final, p.precio)::float8 AS precio_final,
            x.nombre AS d_nombre, x.tipo AS d_tipo, x.valor::float8 AS d_valor
     FROM producto p
     JOIN categoria c ON c.id = p.categoria_id
     JOIN sucursal s ON s.id = p.sucursal_id
     LEFT JOIN LATERAL (
       SELECT d.nombre, d.tipo, d.valor,
              GREATEST(0, CASE d.tipo
                            WHEN 'PORCENTAJE' THEN round(p.precio * (1 - d.valor / 100), 2)
                            ELSE p.precio - d.valor
                          END) AS precio_final
       FROM descuento d
       JOIN descuento_producto dp ON dp.descuento_id = d.id
       WHERE dp.producto_id = p.id
         AND d.activo = true
         AND d.sucursal_id = p.sucursal_id
         AND ${HOY_SQL} BETWEEN d.fecha_inicio AND d.fecha_fin
       ORDER BY precio_final ASC, d.id ASC
       LIMIT 1
     ) x ON true
     WHERE p.sucursal_id = $1 AND p.activo = true AND s.activo = true
     ORDER BY c.orden, c.nombre, p.nombre`,
    [sucursalId],
  );

  return r.rows.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    descripcion: f.descripcion,
    precio: f.precio,
    precio_final: f.precio_final,
    imagen_url: f.imagen_url,
    categoria_id: f.categoria_id,
    categoria: f.categoria,
    sucursal_id: f.sucursal_id,
    descuento: f.d_nombre ? { nombre: f.d_nombre, tipo: f.d_tipo, valor: f.d_valor } : null,
  }));
}
