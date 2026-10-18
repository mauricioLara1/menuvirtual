import { Router } from 'express';
import * as c from '../controllers/productos.controller';

const router = Router();

router.get('/sucursales/:sucursalId/productos', c.listar);
router.get('/productos/:id', c.obtener);
router.post('/productos', c.crear);
router.put('/productos/:id', c.actualizar);
router.delete('/productos/:id', c.eliminar);

export default router;
