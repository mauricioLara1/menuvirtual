import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { subirImagen } from '../controllers/imagenes.controller';
import { requireAuth, requireRol } from '../middlewares/auth';

const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
});

// Traduce los errores de multer a respuestas JSON claras
function recibirImagen(req: Request, res: Response, next: NextFunction) {
  subida.single('imagen')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const grande = err.code === 'LIMIT_FILE_SIZE';
      return res.status(grande ? 413 : 400).json({ error: grande ? 'La imagen pesa más de 5 MB' : 'Archivo inválido' });
    }
    if (err) return next(err);
    next();
  });
}

const router = Router();
router.post('/productos/:id/imagen', requireAuth, requireRol('ADMIN', 'OWNER'), recibirImagen, subirImagen);

export default router;
