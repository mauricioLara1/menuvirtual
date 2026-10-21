import { pool, type Db } from '../config/db';

export interface FiltrosAuditoria {
  accion?: string;
  entidad?: string;
  usuario_id?: number;
  desde?: string;
  hasta?: string;
}

export interface FilaAuditoria {
  id: number;
  fecha: string;
  usuario: string | null;
  accion: string;
  entidad: string;
  entidad_id: number | null;
  descripcion: string | null;
}

// Cada condición usa un $n; los valores van aparte, nunca dentro del texto SQL.
function construirDonde(f: FiltrosAuditoria): { sql: string; valores: unknown[] } {
  const condiciones: string[] = [];
  const valores: unknown[] = [];
  const agregar = (sql: string, valor: unknown) => {
    valores.push(valor);
    condiciones.push(sql.replace('?', `$${valores.length}`));
  };

  if (f.accion) agregar('a.accion = ?', f.accion);
  if (f.entidad) agregar('a.entidad = ?', f.entidad);
  if (f.usuario_id) agregar('a.usuario_id = ?', f.usuario_id);
  if (f.desde) agregar(`(a.fecha AT TIME ZONE 'America/Bogota')::date >= ?::date`, f.desde);
  if (f.hasta) agregar(`(a.fecha AT TIME ZONE 'America/Bogota')::date <= ?::date`, f.hasta);

  return { sql: condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '', valores };
}

export async function consultar(
  filtros: FiltrosAuditoria,
  pagina: number,
  limite: number,
  db: Db = pool,
): Promise<{ total: number; items: FilaAuditoria[] }> {
  const donde = construirDonde(filtros);

  const conteo = await db.query(`SELECT count(*)::int AS n FROM auditoria a ${donde.sql}`, donde.valores);

  const n = donde.valores.length;
  const filas = await db.query(
    `SELECT a.id, a.fecha, u.usuario, a.accion, a.entidad, a.entidad_id, a.descripcion
     FROM auditoria a
     LEFT JOIN usuario u ON u.id = a.usuario_id
     ${donde.sql}
     ORDER BY a.id DESC
     LIMIT $${n + 1} OFFSET $${n + 2}`,
    [...donde.valores, limite, (pagina - 1) * limite],
  );

  return { total: conteo.rows[0].n, items: filas.rows };
}
