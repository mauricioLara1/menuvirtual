import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { conTransaccion } from '../config/db';
import { DIR_UPLOADS } from '../config/uploads';
import * as auditoria from '../repositories/auditoria.repo';
import * as productos from '../repositories/productos.repo';
import { manejarError } from '../utils/http';
import { puedeTocarSucursal } from '../utils/permisos';

export async function subirImagen(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Id inválido' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Falta la imagen (campo "imagen"; jpg, png o webp, máx. 5 MB)' });
    }

    const usuario = req.usuario!;
    const producto = await productos.obtener(id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    if (!puedeTocarSucursal(usuario, producto.sucursal_id)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }

    // sharp decodifica el contenido real: si no es una imagen, falla aquí
    await fs.mkdir(DIR_UPLOADS, { recursive: true });
    const nombre = `${randomUUID()}.webp`;
    const destino = path.join(DIR_UPLOADS, nombre);
    try {
      await sharp(req.file.buffer)
        .rotate()
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(destino);
    } catch {
      return res.status(400).json({ error: 'El archivo no es una imagen válida' });
    }

    const url = `/uploads/${nombre}`;
    try {
      await conTransaccion(async (db) => {
        await productos.actualizarImagen(id, url, db);
        await auditoria.registrar(db, {
          usuario_id: usuario.id,
          accion: 'EDITAR',
          entidad: 'producto',
          entidad_id: id,
          descripcion: `imagen: ${producto.imagen_url ?? '(ninguna)'} -> ${url}`,
        });
      });
    } catch (err) {
      await fs.rm(destino, { force: true });
      throw err;
    }

    // Borrar la imagen anterior (basename evita rutas raras)
    if (producto.imagen_url?.startsWith('/uploads/')) {
      await fs.rm(path.join(DIR_UPLOADS, path.basename(producto.imagen_url)), { force: true });
    }

    return res.json({ imagen_url: url });
  } catch (err) {
    return manejarError(res, err);
  }
}
