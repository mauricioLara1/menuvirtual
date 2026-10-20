import { z } from 'zod';

export const sucursalSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  direccion: z.string().trim().min(1).max(200),
});

export type SucursalInput = z.infer<typeof sucursalSchema>;
