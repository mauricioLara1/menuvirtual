import { z } from 'zod';

const usuario = z
  .string({ message: 'Escribe el usuario' })
  .trim()
  .min(3, 'Mínimo 3 caracteres')
  .max(50, 'Máximo 50 caracteres')
  .regex(/^[a-z0-9._-]+$/, 'Solo minúsculas, números, punto, guion y guion bajo');

// bcrypt solo usa los primeros 72 bytes: más que eso se ignoraría en silencio
export const password = z
  .string({ message: 'Escribe la contraseña' })
  .min(5, 'Mínimo 5 caracteres')
  .refine((s) => Buffer.byteLength(s, 'utf8') <= 72, 'Máximo 72 bytes (unos 72 caracteres)');

const rol = z.enum(['OWNER', 'ADMIN'], { message: 'El rol debe ser OWNER o ADMIN' });
const sucursal_id = z.number().int().positive().nullish();

type ConRol = { rol: string; sucursal_id?: number | null };
const adminNecesitaSucursal = (d: ConRol) => d.rol !== 'ADMIN' || !!d.sucursal_id;
const ownerSinSucursal = (d: ConRol) => d.rol !== 'OWNER' || !d.sucursal_id;

export const usuarioCreateSchema = z
  .object({ usuario, password, rol, sucursal_id })
  .refine(adminNecesitaSucursal, { message: 'Un ADMIN necesita sucursal', path: ['sucursal_id'] })
  .refine(ownerSinSucursal, { message: 'Un OWNER no lleva sucursal', path: ['sucursal_id'] });

// password opcional: si viene, se restablece la clave
export const usuarioUpdateSchema = z
  .object({ rol, sucursal_id, password: password.optional() })
  .refine(adminNecesitaSucursal, { message: 'Un ADMIN necesita sucursal', path: ['sucursal_id'] })
  .refine(ownerSinSucursal, { message: 'Un OWNER no lleva sucursal', path: ['sucursal_id'] });

export const cambioClaveSchema = z.object({
  actual: z.string({ message: 'Escribe tu contraseña actual' }).min(1, 'Escribe tu contraseña actual').max(200),
  nueva: password,
});
