import { z } from 'zod';

const fecha = z
  .string({ message: 'Escribe la fecha' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, 'Esa fecha no existe');

const campos = {
  nombre: z.string({ message: 'Escribe un nombre' }).trim().min(1, 'Escribe un nombre').max(100, 'Máximo 100 caracteres'),
  tipo: z.enum(['PORCENTAJE', 'VALOR_FIJO'], { message: 'El tipo debe ser PORCENTAJE o VALOR_FIJO' }),
  valor: z.number({ message: 'Escribe el valor' }).positive('Debe ser mayor que 0').max(99999999.99, 'Valor demasiado grande'),
  fecha_inicio: fecha,
  fecha_fin: fecha,
  producto_ids: z
    .array(z.number().int().positive(), { message: 'Elige al menos un producto' })
    .min(1, 'Elige al menos un producto')
    .max(500, 'Demasiados productos')
    .refine((a) => new Set(a).size === a.length, 'Hay productos repetidos'),
};

const reglaValor = (d: { tipo: string; valor: number }) => d.tipo !== 'PORCENTAJE' || d.valor <= 100;
const reglaFechas = (d: { fecha_inicio: string; fecha_fin: string }) => d.fecha_fin >= d.fecha_inicio;

const base = z.object(campos);

export const descuentoUpdateSchema = base
  .refine(reglaValor, { message: 'Un porcentaje no puede superar 100', path: ['valor'] })
  .refine(reglaFechas, { message: 'La fecha fin no puede ser anterior al inicio', path: ['fecha_fin'] });

export const descuentoCreateSchema = base
  .extend({ sucursal_id: z.number().int().positive().optional() })
  .refine(reglaValor, { message: 'Un porcentaje no puede superar 100', path: ['valor'] })
  .refine(reglaFechas, { message: 'La fecha fin no puede ser anterior al inicio', path: ['fecha_fin'] });

export type DescuentoUpdateInput = z.infer<typeof descuentoUpdateSchema>;
