import type { Request, Response } from 'express';
import * as repo from '../repositories/productos.repo';
import * as auditoria from '../repositories/auditoria.repo';
import { productoCreateSchema, productoUpdateSchema } from '../schemas/productos.schema';
import { conTransaccion } from '../config/db';
import { idValido, errorValidacion, manejarError } from '../utils/http';
import { puedeTocarSucursal, sucursalPermitida } from '../utils/permisos';
import { describirCambios } from '../utils/auditoria';

const CAMPOS_AUDITADOS = ['nombre', 'descripcion', 'precio', 'imagen_url', 'categoria_id'];

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
  const usuario = req.usuario!; // requireAuth ya lo dejó aquí
  const parsed = productoCreateSchema.safeParse(req.body);
  if (!parsed.success) return errorValidacion(res, parsed.error.issues);

  const permiso = sucursalPermitida(usuario, parsed.data.sucursal_id);
  if (!permiso.ok) return res.status(permiso.status).json({ error: permiso.error });

  try {
    const creado = await conTransaccion(async (db) => {
      const p = await repo.crear({ ...parsed.data, sucursal_id: permiso.sucursalId }, db);
      await auditoria.registrar(db, {
        usuario_id: usuario.id,
        accion: 'CREAR',
        entidad: 'producto',
        entidad_id: p.id,
        descripcion: `Creó "${p.nombre}" (precio ${p.precio}) en la sucursal ${p.sucursal_id}`,
      });
      return p;
    });
    res.status(201).json(creado);
  } catch (err) {
    manejarError(res, err);
  }
}

export async function actualizar(req: Request, res: Response) {
  const usuario = req.usuario!;
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'Id inválido' });
  const parsed = productoUpdateSchema.safeParse(req.body);
  if (!parsed.success) return errorValidacion(res, parsed.error.issues);

  try {
    const antes = await repo.obtener(id);
    if (!antes) return res.status(404).json({ error: 'Producto no encontrado' });
    if (!puedeTocarSucursal(usuario, antes.sucursal_id)) {
      return res.status(403).json({ error: 'No tienes permiso sobre esta sucursal' });
    }

    const despues = await conTransaccion(async (db) => {
      const p = await repo.actualizar(id, parsed.data, db);
      if (p) {
        await auditoria.registrar(db, {
          usuario_id: usuario.id,
          accion: 'EDITAR',
          entidad: 'producto',
          entidad_id: id,
          descripcion: describirCambios(antes, p, CAMPOS_AUDITADOS),
        });
      }
      return p;
    });
    if (!despues) return res.status(404).json({ error: 'Producto no encontrado' });
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
    if (!antes) return res.status(404).json({ error: 'Producto no encontrado' });
    if (!puedeTocarSucursal(usuario, antes.sucursal_id)) {
      return res.status(403).json({ error: 'No tienes permiso sobre esta sucursal' });
    }

    const ok = await conTransaccion(async (db) => {
      const hecho = await repo.desactivar(id, db);
      if (hecho) {
        await auditoria.registrar(db, {
          usuario_id: usuario.id,
          accion: 'ELIMINAR',
          entidad: 'producto',
          entidad_id: id,
          descripcion: `Eliminó "${antes.nombre}"`,
        });
      }
      return hecho;
    });
    if (!ok) return res.status(404).json({ error: 'Producto no encontrado' });
    res.status(204).send();
  } catch (err) {
    manejarError(res, err);
  }
}
