import { Router } from 'express';
import * as c from '../controllers/categorias.controller';
import { requireAuth, requireRol } from '../middlewares/auth';

const router = Router();
const soloOwner = requireRol('OWNER');

// Públicas
router.get('/categorias', c.listar);
router.get('/categorias/:id', c.obtener);

// Solo el OWNER
router.post('/categorias', requireAuth, soloOwner, c.crear);
router.put('/categorias/:id', requireAuth, soloOwner, c.actualizar);
router.delete('/categorias/:id', requireAuth, soloOwner, c.eliminar);

export default router;
