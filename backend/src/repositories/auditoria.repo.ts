import type { Db } from '../config/db';

export interface RegistroAuditoria {
  usuario_id: number;
  accion: 'CREAR' | 'EDITAR' | 'ELIMINAR';
  entidad: string; // 'producto', 'usuario', 'descuento'...
  entidad_id: number;
  descripcion?: string;
}

// Se llama con la MISMA conexión de la transacción del cambio que se audita
export async function registrar(db: Db, a: RegistroAuditoria) {
  await db.query(
    `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, descripcion)
     VALUES ($1, $2, $3, $4, $5)`,
    [a.usuario_id, a.accion, a.entidad, a.entidad_id, a.descripcion ?? null]
  );
}
