import path from 'path';
import dotenv from 'dotenv';

// El .env está en la raíz del proyecto, un nivel arriba de backend/
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

function requerida(nombre: string, minimo = 1): string {
  const valor = process.env[nombre];
  if (!valor || valor.length < minimo) {
    throw new Error(`Falta ${nombre} en el .env` + (minimo > 1 ? ` (mínimo ${minimo} caracteres)` : ''));
  }
  return valor;
}

export const env = {
  DATABASE_URL: requerida('DATABASE_URL'),
  JWT_SECRET: requerida('JWT_SECRET', 32),
  PRODUCCION: process.env.NODE_ENV === 'production',
};
