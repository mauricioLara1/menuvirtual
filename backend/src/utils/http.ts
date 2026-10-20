import type { Response } from 'express';

export function idValido(valor: unknown): number | null {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function errorValidacion(res: Response, issues: { path: PropertyKey[]; message: string }[]) {
  return res.status(400).json({
    error: 'Datos inválidos',
    detalles: issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
  });
}

export function manejarError(
  res: Response,
  err: any,
  mensajeDuplicado = 'Ya existe un registro con ese valor'
) {
  // 23503 = llave foránea (un id relacionado no existe)
  if (err?.code === '23503') {
    return res.status(400).json({ error: 'Un id relacionado no existe (categoría, sucursal...)' });
  }
  // 23505 = valor único repetido (nombre de categoría, usuario...)
  if (err?.code === '23505') {
    return res.status(409).json({ error: mensajeDuplicado });
  }
  console.error(err); // el detalle queda en el servidor, no se envía al cliente
  return res.status(500).json({ error: 'Error interno del servidor' });
}
