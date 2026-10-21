import { Router } from 'express';
import * as c from '../controllers/descuentos.controller';
import { requireAuth, requireRol } from '../middlewares/auth';

const router = Router();
const soloPersonal = [requireAuth, requireRol('ADMIN', 'OWNER')];

router.get('/descuentos', ...soloPersonal, c.listar);
router.post('/descuentos', ...soloPersonal, c.crear);
router.put('/descuentos/:id', ...soloPersonal, c.actualizar);
router.delete('/descuentos/:id', ...soloPersonal, c.eliminar);

export default router;
