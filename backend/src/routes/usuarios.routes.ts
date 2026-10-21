import { Router } from 'express';
import * as c from '../controllers/usuarios.controller';
import { requireAuth, requireRol } from '../middlewares/auth';

const router = Router();
const soloOwner = [requireAuth, requireRol('OWNER')];

router.get('/usuarios', ...soloOwner, c.listar);
router.post('/usuarios', ...soloOwner, c.crear);
router.put('/usuarios/:id', ...soloOwner, c.actualizar);
router.delete('/usuarios/:id', ...soloOwner, c.eliminar);

export default router;
