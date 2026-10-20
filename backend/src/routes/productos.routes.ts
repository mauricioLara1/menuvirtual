import { Router } from 'express';
import * as c from '../controllers/productos.controller';
import { requireAuth, requireRol } from '../middlewares/auth';

const router = Router();
const personal = requireRol('ADMIN', 'OWNER');

// Públicas: las usa el menú
router.get('/sucursales/:sucursalId/productos', c.listar);
router.get('/productos/:id', c.obtener);

// Con sesión: ADMIN (su sucursal) u OWNER (cualquiera)
router.post('/productos', requireAuth, personal, c.crear);
router.put('/productos/:id', requireAuth, personal, c.actualizar);
router.delete('/productos/:id', requireAuth, personal, c.eliminar);

export default router;
