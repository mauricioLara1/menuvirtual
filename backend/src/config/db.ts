import { Pool, type PoolClient, type QueryResult } from 'pg';
import { env } from './env';

export const pool = new Pool({ connectionString: env.DATABASE_URL });

// Lo que necesita un repository para consultar: sirve con el pool o con una transacción
export interface Db {
  query(texto: string, valores?: any[]): Promise<QueryResult<any>>;
}

// Ejecuta varias consultas como una sola unidad: se guardan todas o ninguna
export async function conTransaccion<T>(fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
