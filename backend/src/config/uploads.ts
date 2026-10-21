import path from 'node:path';

// Relativa a backend/ (igual que el .env, se corre desde esa carpeta)
export const DIR_UPLOADS = path.resolve(process.cwd(), 'uploads');
