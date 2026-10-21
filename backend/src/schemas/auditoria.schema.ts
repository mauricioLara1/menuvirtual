import { z } from 'zod';

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, 'Esa fecha no existe');

export const auditoriaQuerySchema = z
  .object({
    pagina: z.coerce.number().int().min(1, 'Mínimo 1').default(1),
    limite: z.coerce.number().int().min(1, 'Mínimo 1').max(100, 'Máximo 100').default(20),
    accion: z.enum(['CREAR', 'EDITAR', 'ELIMINAR'], { message: 'Acción inválida' }).optional(),
    entidad: z.string().regex(/^[a-z_]{1,30}$/, 'Entidad inválida').optional(),
    usuario_id: z.coerce.number().int().positive().optional(),
    desde: fecha.optional(),
    hasta: fecha.optional(),
  })
  .refine((d) => !d.desde || !d.hasta || d.hasta >= d.desde, {
    message: '"hasta" no puede ser anterior a "desde"',
    path: ['hasta'],
  });
