import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { env } from '../config/env';
import * as repo from '../repositories/usuarios.repo';
import { COOKIE_SESION, DURACION_SEGUNDOS, firmarToken } from '../utils/token';
import { errorValidacion, manejarError } from '../utils/http';

const loginSchema = z.object({
  usuario: z.string().trim().min(1).max(50),
  password: z.string().min(1).max(200),
});

// Hash de mentira: se compara igual cuando el usuario no existe, para que la
// respuesta tarde lo mismo y no se pueda adivinar qué usuarios existen
const HASH_FALSO = bcrypt.hashSync('no-es-una-clave-real', 12);

const opcionesCookie = {
  httpOnly: true, // JavaScript del navegador no puede leerla (protege contra XSS)
  sameSite: 'strict' as const, // no se envía desde otros sitios (protege contra CSRF)
  secure: env.PRODUCCION, // en producción, solo por HTTPS
  path: '/',
};

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return errorValidacion(res, parsed.error.issues);
  const { usuario, password } = parsed.data;
  try {
    const u = await repo.buscarParaLogin(usuario);
    const ok = await bcrypt.compare(password, u?.password_hash ?? HASH_FALSO);
    if (!u || !ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    res.cookie(COOKIE_SESION, firmarToken(u.id), {
      ...opcionesCookie,
      maxAge: DURACION_SEGUNDOS * 1000,
    });
    res.json({ id: u.id, usuario: u.usuario, rol: u.rol, sucursal_id: u.sucursal_id });
  } catch (err) {
    manejarError(res, err);
  }
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(COOKIE_SESION, opcionesCookie);
  res.status(204).send();
}

// Quién soy (requireAuth ya dejó el usuario en req.usuario)
export function yo(req: Request, res: Response) {
  res.json(req.usuario);
}
