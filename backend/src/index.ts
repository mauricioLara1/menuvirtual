import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool } from './config/db';
import productosRoutes from './routes/productos.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' })); // el frontend de Vite
app.use(express.json());

// Comprueba que la API y la BD responden
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.use('/api', productosRoutes);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
