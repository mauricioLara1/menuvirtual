import type { Request, Response } from 'express';
import { conTransaccion } from '../config/db';
import * as auditoria from '../repositories/auditoria.repo';
import * as descuentos from '../repositories/descuentos.repo';
import { descuentoCreateSchema, descuentoUpdateSchema } from '../schemas/descuentos.schema';
import { describirCambios } from '../utils/auditoria';
import { errorValidacion, manejarError } from '../utils/http';
import { puedeTocarSucursal, sucursalPermitida } from '../utils/permisos';

const MSG_PRODUCTOS = 'Algún producto no existe, está eliminado o no pertenece a esta sucursal';

function leerId(valor: unknown): number | null {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function resumen(d: { nombre: string; tipo: string; valor: number; fecha_inicio: string; fecha_fin: string; producto_ids: number[] }) {
  const valor = d.tipo === 'PORCENTAJE' ? `${d.valor}%` : `$${d.valor}`;
  return `${d.nombre} (${valor}) del ${d.fecha_inicio} al ${d.fecha_fin}, ${d.producto_ids.length} producto(s)`;
}

export async function listar(req: Request, res: Response) {
  try {
    let pedida: number | undefined;
    if (req.query.sucursal_id !== undefined) {
      const n = leerId(req.query.sucursal_id);
      if (n === null) return res.status(400).json({ error: 'sucursal_id inválido' });
      pedida = n;
    }
    const permiso = sucursalPermitida(req.usuario!, pedida);
    if (!permiso.ok) return res.status(permiso.status).json({ error: permiso.error });
    return res.json(await descuentos.listarPorSucursal(permiso.sucursalId));
  } catch (err) {
    return manejarError(res, err);
  }
}

export async function crear(req: Request, res: Response) {
  try {
    const parsed = descuentoCreateSchema.safeParse(req.body);
    if (!parsed.success) return errorValidacion(res, parsed.error.issues);
    const d = parsed.data;

    const usuario = req.usuario!;
    const permiso = sucursalPermitida(usuario, d.sucursal_id);
    if (!permiso.ok) return res.status(permiso.status).json({ error: permiso.error });

    const validos = await descuentos.contarProductosValidos(d.producto_ids, permiso.sucursalId);
    if (validos !== d.producto_ids.length) return res.status(400).json({ error: MSG_PRODUCTOS });

    const datos = { ...d, sucursal_id: permiso.sucursalId };
    const id = await conTransaccion(async (db) => {
      const nuevo = await descuentos.crear(db, datos);
      await auditoria.registrar(db, {
        usuario_id: usuario.id,
        accion: 'CREAR',
        entidad: 'descuento',
        entidad_id: nuevo,
        descripcion: resumen(datos),
      });
      return nuevo;
    });

    return res.status(201).json(await descuentos.obtener(id));
  } catch (err) {
    return manejarError(res, err);
  }
}

export async function actualizar(req: Request, res: Response) {
  try {
    const id = leerId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Id inválido' });

    const antes = await descuentos.obtener(id);
    if (!antes) return res.status(404).json({ error: 'Descuento no encontrado' });
    const usuario = req.usuario!;
    if (!puedeTocarSucursal(usuario, antes.sucursal_id)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }

    const parsed = descuentoUpdateSchema.safeParse(req.body);
    if (!parsed.success) return errorValidacion(res, parsed.error.issues);
    const d = parsed.data;

    const validos = await descuentos.contarProductosValidos(d.producto_ids, antes.sucursal_id);
    if (validos !== d.producto_ids.length) return res.status(400).json({ error: MSG_PRODUCTOS });

    const campos = ['nombre', 'tipo', 'valor', 'fecha_inicio', 'fecha_fin', 'producto_ids'];
    const objAntes = { ...antes, producto_ids: antes.producto_ids.join(',') };
    const objDespues = { ...d, producto_ids: [...d.producto_ids].sort((a, b) => a - b).join(',') };

    await conTransaccion(async (db) => {
      await descuentos.actualizar(db, id, d);
      await auditoria.registrar(db, {
        usuario_id: usuario.id,
        accion: 'EDITAR',
        entidad: 'descuento',
        entidad_id: id,
        descripcion: describirCambios(objAntes, objDespues, campos),
      });
    });

    return res.json(await descuentos.obtener(id));
  } catch (err) {
    return manejarError(res, err);
  }
}

export async function eliminar(req: Request, res: Response) {
  try {
    const id = leerId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Id inválido' });

    const antes = await descuentos.obtener(id);
    if (!antes) return res.status(404).json({ error: 'Descuento no encontrado' });
    const usuario = req.usuario!;
    if (!puedeTocarSucursal(usuario, antes.sucursal_id)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }

    await conTransaccion(async (db) => {
      await descuentos.desactivar(db, id);
      await auditoria.registrar(db, {
        usuario_id: usuario.id,
        accion: 'ELIMINAR',
        entidad: 'descuento',
        entidad_id: id,
        descripcion: `Descuento eliminado: ${antes.nombre}`,
      });
    });

    return res.status(204).send();
  } catch (err) {
    return manejarError(res, err);
  }
}
