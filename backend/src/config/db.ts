import path from 'path';
import dotenv from 'dotenv';
import { Pool, type PoolClient } from 'pg';

// El .env está en la raíz del proyecto, un nivel arriba de backend/
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en el .env');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Ejecuta varias consultas como una sola unidad: se guardan todas o ninguna
export async function conTransaccion<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
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
