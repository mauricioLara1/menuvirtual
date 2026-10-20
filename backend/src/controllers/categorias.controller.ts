import type { Request, Response } from 'express';
import * as repo from '../repositories/categorias.repo';
import * as auditoria from '../repositories/auditoria.repo';
import { categoriaSchema } from '../schemas/categorias.schema';
import { conTransaccion } from '../config/db';
import { idValido, errorValidacion, manejarError } from '../utils/http';
import { describirCambios } from '../utils/auditoria';

const DUPLICADA = 'Ya existe una categoría con ese nombre';

export async function listar(_req: Request, res: Response) {
  try {
    res.json(await repo.listar());
  } catch (err) {
    manejarError(res, err);
  }
}

export async function obtener(req: Request, res: Response) {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'Id inválido' });
  try {
    const categoria = await repo.obtener(id);
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(categoria);
  } catch (err) {
    manejarError(res, err);
  }
}

export async function crear(req: Request, res: Response) {
  const usuario = req.usuario!;
  const parsed = categoriaSchema.safeParse(req.body);
  if (!parsed.success) return errorValidacion(res, parsed.error.issues);
  try {
    const creada = await conTransaccion(async (db) => {
      const c = await repo.crear(parsed.data, db);
      await auditoria.registrar(db, {
        usuario_id: usuario.id,
        accion: 'CREAR',
        entidad: 'categoria',
        entidad_id: c.id,
        descripcion: `Creó la categoría "${c.nombre}"`,
      });
      return c;
    });
    res.status(201).json(creada);
  } catch (err) {
    manejarError(res, err, DUPLICADA);
  }
}

export async function actualizar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'Id inválido' });
  const parsed = categoriaSchema.safeParse(req.body);
  if (!parsed.success) return errorValidacion(res, parsed.error.issues);
  try {
    const antes = await repo.obtener(id);
    if (!antes) return res.status(404).json({ error: 'Categoría no encontrada' });

    const despues = await conTransaccion(async (db) => {
      const c = await repo.actualizar(id, parsed.data, db);
      if (c) {
        await auditoria.registrar(db, {
          usuario_id: usuario.id,
          accion: 'EDITAR',
          entidad: 'categoria',
          entidad_id: id,
          descripcion: describirCambios(antes, c, ['nombre', 'orden']),
        });
      }
      return c;
    });
    if (!despues) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(despues);
  } catch (err) {
    manejarError(res, err, DUPLICADA);
  }
}

export async function eliminar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'Id inválido' });
  try {
    const antes = await repo.obtener(id);
    if (!antes) return res.status(404).json({ error: 'Categoría no encontrada' });

    const n = await repo.contarProductosActivos(id);
    if (n > 0) {
      return res.status(409).json({ error: `No se puede eliminar: tiene ${n} producto(s) activo(s)` });
    }

    const ok = await conTransaccion(async (db) => {
      const hecho = await repo.desactivar(id, db);
      if (hecho) {
        await auditoria.registrar(db, {
          usuario_id: usuario.id,
          accion: 'ELIMINAR',
          entidad: 'categoria',
          entidad_id: id,
          descripcion: `Eliminó la categoría "${antes.nombre}"`,
        });
      }
      return hecho;
    });
    if (!ok) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.status(204).send();
  } catch (err) {
    manejarError(res, err);
  }
}
