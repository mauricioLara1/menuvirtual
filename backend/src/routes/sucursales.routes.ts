import { Router } from 'express';
import * as c from '../controllers/sucursales.controller';
import { requireAuth, requireRol } from '../middlewares/auth';

const router = Router();
const soloOwner = requireRol('OWNER');

// Públicas
router.get('/sucursales', c.listar);
router.get('/sucursales/:id', c.obtener);

// Solo el OWNER
router.post('/sucursales', requireAuth, soloOwner, c.crear);
router.put('/sucursales/:id', requireAuth, soloOwner, c.actualizar);
router.delete('/sucursales/:id', requireAuth, soloOwner, c.eliminar);

export default router;
