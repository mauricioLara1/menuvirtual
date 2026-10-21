import type { Request, Response } from 'express';
import * as menu from '../repositories/menu.repo';
import { manejarError } from '../utils/http';

export async function obtenerMenu(req: Request, res: Response) {
  const id = Number(req.params.sucursalId);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Id inválido' });
  }
  try {
    return res.json(await menu.listarMenu(id));
  } catch (err) {
    return manejarError(res, err);
  }
}
