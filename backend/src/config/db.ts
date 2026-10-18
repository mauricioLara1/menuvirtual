import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// El .env está en la raíz del proyecto, un nivel arriba de backend/
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en el .env');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
