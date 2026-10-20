import { z } from 'zod';

// Campos que se pueden modificar de un producto
export const productoUpdateSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  descripcion: z.string().trim().max(500).nullish(),
  precio: z.number().min(0).max(99999999.99),
  imagen_url: z.string().trim().max(300).nullish(),
  categoria_id: z.number().int().positive(),
});

// Al crear, sucursal_id es opcional en el cuerpo: el ADMIN usa la suya (de la sesión)
// y el OWNER debe indicarla
export const productoCreateSchema = productoUpdateSchema.extend({
  sucursal_id: z.number().int().positive().optional(),
});

export type ProductoUpdateInput = z.infer<typeof productoUpdateSchema>;
export type ProductoInput = ProductoUpdateInput & { sucursal_id: number };
