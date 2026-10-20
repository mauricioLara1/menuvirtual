import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const COOKIE_SESION = 'sesion';
export const DURACION_SEGUNDOS = 8 * 60 * 60; // 8 horas

// El token solo identifica al usuario (sub = id). Rol y sucursal se leen de la BD.
export function firmarToken(usuarioId: number): string {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(usuarioId),
    expiresIn: DURACION_SEGUNDOS,
  });
}

// Devuelve el id del usuario, o null si el token es falso, está alterado o venció
export function verificarToken(token: string): number | null {
  try {
    // Se fija el algoritmo: así nadie puede colar un token "sin firma"
    const d = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof d === 'string' || !d.sub) return null;
    const id = Number(d.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
