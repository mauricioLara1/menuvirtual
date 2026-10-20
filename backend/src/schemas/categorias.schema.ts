import { z } from 'zod';

export const categoriaSchema = z.object({
  nombre: z.string().trim().min(1).max(50),
  orden: z.number().int().min(0).max(9999).optional(), // si no viene: 0 al crear, se conserva al editar
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;
