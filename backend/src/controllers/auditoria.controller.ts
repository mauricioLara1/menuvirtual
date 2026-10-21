import type { Request, Response } from 'express';
import { consultar } from '../repositories/auditoria.consulta.repo';
import { auditoriaQuerySchema } from '../schemas/auditoria.schema';
import { errorValidacion, manejarError } from '../utils/http';

export async function listar(req: Request, res: Response) {
  try {
    const parsed = auditoriaQuerySchema.safeParse(req.query);
    if (!parsed.success) return errorValidacion(res, parsed.error.issues);

    const { pagina, limite, ...filtros } = parsed.data;
    const { total, items } = await consultar(filtros, pagina, limite);
    return res.json({ total, pagina, limite, paginas: Math.max(1, Math.ceil(total / limite)), items });
  } catch (err) {
    return manejarError(res, err);
  }
}
