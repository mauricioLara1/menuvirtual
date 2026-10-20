import type { Request, Response } from 'express';
import * as repo from '../repositories/sucursales.repo';
import * as auditoria from '../repositories/auditoria.repo';
import { sucursalSchema } from '../schemas/sucursales.schema';
import { conTransaccion } from '../config/db';
import { idValido, errorValidacion, manejarError } from '../utils/http';
import { describirCambios } from '../utils/auditoria';

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
    const sucursal = await repo.obtener(id);
    if (!sucursal) return res.status(404).json({ error: 'Sucursal no encontrada' });
    res.json(sucursal);
  } catch (err) {
    manejarError(res, err);
  }
}

export async function crear(req: Request, res: Response) {
  const usuario = req.usuario!;
  const parsed = sucursalSchema.safeParse(req.body);
  if (!parsed.success) return errorValidacion(res, parsed.error.issues);
  try {
    const creada = await conTransaccion(async (db) => {
      const s = await repo.crear(parsed.data, db);
      await auditoria.registrar(db, {
        usuario_id: usuario.id,
        accion: 'CREAR',
        entidad: 'sucursal',
        entidad_id: s.id,
        descripcion: `Creó la sucursal "${s.nombre}"`,
      });
      return s;
    });
    res.status(201).json(creada);
  } catch (err) {
    manejarError(res, err);
  }
}

export async function actualizar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'Id inválido' });
  const parsed = sucursalSchema.safeParse(req.body);
  if (!parsed.success) return errorValidacion(res, parsed.error.issues);
  try {
    const antes = await repo.obtener(id);
    if (!antes) return res.status(404).json({ error: 'Sucursal no encontrada' });

    const despues = await conTransaccion(async (db) => {
      const s = await repo.actualizar(id, parsed.data, db);
      if (s) {
        await auditoria.registrar(db, {
          usuario_id: usuario.id,
          accion: 'EDITAR',
          entidad: 'sucursal',
          entidad_id: id,
          descripcion: describirCambios(antes, s, ['nombre', 'direccion']),
        });
      }
      return s;
    });
    if (!despues) return res.status(404).json({ error: 'Sucursal no encontrada' });
    res.json(despues);
  } catch (err) {
    manejarError(res, err);
  }
}

export async function eliminar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'Id inválido' });
  try {
    const antes = await repo.obtener(id);
    if (!antes) return res.status(404).json({ error: 'Sucursal no encontrada' });

    const ok = await conTransaccion(async (db) => {
      const hecho = await repo.desactivar(id, db);
      if (hecho) {
        await auditoria.registrar(db, {
          usuario_id: usuario.id,
          accion: 'ELIMINAR',
          entidad: 'sucursal',
          entidad_id: id,
          descripcion: `Eliminó la sucursal "${antes.nombre}"`,
        });
      }
      return hecho;
    });
    if (!ok) return res.status(404).json({ error: 'Sucursal no encontrada' });
    res.status(204).send();
  } catch (err) {
    manejarError(res, err);
  }
}
