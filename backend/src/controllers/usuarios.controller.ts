import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { conTransaccion } from '../config/db';
import * as auditoria from '../repositories/auditoria.repo';
import * as repo from '../repositories/usuarios.gestion.repo';
import { usuarioCreateSchema, usuarioUpdateSchema } from '../schemas/usuarios.schema';
import { describirCambios } from '../utils/auditoria';
import { errorValidacion, manejarError } from '../utils/http';

const COSTO_BCRYPT = 12;

function leerId(valor: unknown): number | null {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function listar(_req: Request, res: Response) {
  try {
    return res.json(await repo.listar());
  } catch (err) {
    return manejarError(res, err);
  }
}

export async function crear(req: Request, res: Response) {
  try {
    const parsed = usuarioCreateSchema.safeParse(req.body);
    if (!parsed.success) return errorValidacion(res, parsed.error.issues);
    const d = parsed.data;

    const sucursalId = d.rol === 'ADMIN' ? (d.sucursal_id ?? null) : null;
    if (sucursalId !== null && !(await repo.sucursalActiva(sucursalId))) {
      return res.status(400).json({ error: 'La sucursal no existe' });
    }

    const hash = await bcrypt.hash(d.password, COSTO_BCRYPT);
    const actor = req.usuario!;
    const id = await conTransaccion(async (db) => {
      const nuevo = await repo.crear(db, { usuario: d.usuario, password_hash: hash, rol: d.rol, sucursal_id: sucursalId });
      await auditoria.registrar(db, {
        usuario_id: actor.id,
        accion: 'CREAR',
        entidad: 'usuario',
        entidad_id: nuevo,
        descripcion: `Creó el usuario "${d.usuario}" (${d.rol}${sucursalId ? `, sucursal ${sucursalId}` : ''})`,
      });
      return nuevo;
    });

    return res.status(201).json(await repo.obtener(id));
  } catch (err) {
    return manejarError(res, err, 'Ya existe un usuario con ese nombre');
  }
}

export async function actualizar(req: Request, res: Response) {
  try {
    const id = leerId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Id inválido' });

    const antes = await repo.obtener(id);
    if (!antes) return res.status(404).json({ error: 'Usuario no encontrado' });

    const parsed = usuarioUpdateSchema.safeParse(req.body);
    if (!parsed.success) return errorValidacion(res, parsed.error.issues);
    const d = parsed.data;

    const sucursalId = d.rol === 'ADMIN' ? (d.sucursal_id ?? null) : null;
    if (sucursalId !== null && !(await repo.sucursalActiva(sucursalId))) {
      return res.status(400).json({ error: 'La sucursal no existe' });
    }
    if (antes.rol === 'OWNER' && d.rol !== 'OWNER' && (await repo.contarOwnersActivos()) <= 1) {
      return res.status(409).json({ error: 'No puedes quitar el rol al único OWNER' });
    }

    const hash = d.password ? await bcrypt.hash(d.password, COSTO_BCRYPT) : null;
    const actor = req.usuario!;
    const cambios = describirCambios(antes, { ...antes, rol: d.rol, sucursal_id: sucursalId }, ['rol', 'sucursal_id']);
    const descripcion = hash
      ? cambios === 'Sin cambios' ? 'Clave restablecida' : `${cambios}; clave restablecida`
      : cambios;

    await conTransaccion(async (db) => {
      await repo.actualizar(db, id, d.rol, sucursalId);
      if (hash) await repo.cambiarClave(db, id, hash);
      await auditoria.registrar(db, {
        usuario_id: actor.id,
        accion: 'EDITAR',
        entidad: 'usuario',
        entidad_id: id,
        descripcion: `${antes.usuario}: ${descripcion}`,
      });
    });

    return res.json(await repo.obtener(id));
  } catch (err) {
    return manejarError(res, err);
  }
}

export async function eliminar(req: Request, res: Response) {
  try {
    const id = leerId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Id inválido' });

    const actor = req.usuario!;
    if (id === actor.id) return res.status(409).json({ error: 'No puedes eliminar tu propio usuario' });

    const antes = await repo.obtener(id);
    if (!antes) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (antes.rol === 'OWNER' && (await repo.contarOwnersActivos()) <= 1) {
      return res.status(409).json({ error: 'No puedes eliminar al único OWNER' });
    }

    await conTransaccion(async (db) => {
      await repo.desactivar(db, id);
      await auditoria.registrar(db, {
        usuario_id: actor.id,
        accion: 'ELIMINAR',
        entidad: 'usuario',
        entidad_id: id,
        descripcion: `Eliminó el usuario "${antes.usuario}"`,
      });
    });

    return res.status(204).send();
  } catch (err) {
    return manejarError(res, err);
  }
}
