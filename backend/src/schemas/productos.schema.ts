import { z } from 'zod';

export const productoSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  descripcion: z.string().trim().max(500).nullish(),
  precio: z.number().min(0),
  imagen_url: z.string().trim().max(300).nullish(),
  categoria_id: z.number().int().positive(),
  sucursal_id: z.number().int().positive(),
});

// Al modificar no se permite cambiar de sucursal
export const productoUpdateSchema = productoSchema.omit({ sucursal_id: true });

export type ProductoInput = z.infer<typeof productoSchema>;
export type ProductoUpdateInput = z.infer<typeof productoUpdateSchema>;
