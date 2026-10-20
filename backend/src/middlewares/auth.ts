import type { NextFunction, Request, Response } from 'express';
import { COOKIE_SESION, verificarToken } from '../utils/token';
import * as usuarios from '../repositories/usuarios.repo';
import type { UsuarioSesion } from '../repositories/usuarios.repo';
import { manejarError } from '../utils/http';

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioSesion;
    }
  }
}

// Exige sesión válida. Deja el usuario en req.usuario (datos frescos de la BD).
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_SESION];
  const id = token ? verificarToken(token) : null;
  if (!id) return res.status(401).json({ error: 'No autenticado' });
  try {
    const usuario = await usuarios.obtenerSesion(id);
    if (!usuario) return res.status(401).json({ error: 'No autenticado' });
    req.usuario = usuario;
    next();
  } catch (err) {
    manejarError(res, err);
  }
}

// Exige uno de los roles dados. Se usa DESPUÉS de requireAuth.
export function requireRol(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }
    next();
  };
}
