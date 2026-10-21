import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { conTransaccion } from '../config/db';
import * as auditoria from '../repositories/auditoria.repo';
import * as repo from '../repositories/usuarios.gestion.repo';
import { cambioClaveSchema } from '../schemas/usuarios.schema';
import { errorValidacion, manejarError } from '../utils/http';

export async function cambiarMiClave(req: Request, res: Response) {
  try {
    const parsed = cambioClaveSchema.safeParse(req.body);
    if (!parsed.success) return errorValidacion(res, parsed.error.issues);
    const { actual, nueva } = parsed.data;

    const yo = req.usuario!;
    const hashActual = await repo.obtenerHash(yo.id);
    // 400 y no 401: un 401 haría creer al frontend que la sesión expiró
    if (!hashActual || !(await bcrypt.compare(actual, hashActual))) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta' });
    }
    if (nueva === actual) {
      return res.status(400).json({ error: 'La nueva contraseña debe ser distinta a la actual' });
    }

    const hashNuevo = await bcrypt.hash(nueva, 12);
    await conTransaccion(async (db) => {
      await repo.cambiarClave(db, yo.id, hashNuevo);
      await auditoria.registrar(db, {
        usuario_id: yo.id,
        accion: 'EDITAR',
        entidad: 'usuario',
        entidad_id: yo.id,
        descripcion: `${yo.usuario}: cambió su propia contraseña`,
      });
    });

    return res.status(204).send();
  } catch (err) {
    return manejarError(res, err);
  }
}
