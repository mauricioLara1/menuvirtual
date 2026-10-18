import type { Request, Response } from 'express';
import * as repo from '../repositories/productos.repo';
import { productoSchema, productoUpdateSchema } from '../schemas/productos.schema';

function idValido(valor: unknown): number | null {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function manejarError(res: Response, err: any) {
  // 23503 = violación de llave foránea (categoría o sucursal inexistente)
  if (err?.code === '23503') {
    return res.status(400).json({ error: 'La categoría o la sucursal no existe' });
  }
  console.error(err); // el detalle queda en el servidor, no se envía al cliente
  return res.status(500).json({ error: 'Error interno del servidor' });
}

function errorValidacion(res: Response, issues: { path: PropertyKey[]; message: string }[]) {
  return res.status(400).json({
    error: 'Datos inválidos',
    detalles: issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
  });
}

export async function listar(req: Request, res: Response) {
  const sucursalId = idValido(req.params.sucursalId);
  if (!sucursalId) return res.status(400).json({ error: 'Id de sucursal inválido' });
  try {
    res.json(await repo.listarPorSucursal(sucursalId));
  } catch (err) {
    manejarError(res, err);
  }
}

export async function obtener(req: Request, res: Response) {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'Id inválido' });
  try {
    const producto = await repo.obtener(id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    manejarError(res, err);
  }
}

export async function crear(req: Request, res: Response) {
  const parsed = productoSchema.safeParse(req.body);
  if (!parsed.success) return errorValidacion(res, parsed.error.issues);
  try {
    res.status(201).json(await repo.crear(parsed.data));
  } catch (err) {
    manejarError(res, err);
  }
}

export async function actualizar(req: Request, res: Response) {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'Id inválido' });
  const parsed = productoUpdateSchema.safeParse(req.body);
  if (!parsed.success) return errorValidacion(res, parsed.error.issues);
  try {
    const producto = await repo.actualizar(id, parsed.data);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    manejarError(res, err);
  }
}

export async function eliminar(req: Request, res: Response) {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'Id inválido' });
  try {
    const ok = await repo.desactivar(id);
    if (!ok) return res.status(404).json({ error: 'Producto no encontrado' });
    res.status(204).send();
  } catch (err) {
    manejarError(res, err);
  }
}
