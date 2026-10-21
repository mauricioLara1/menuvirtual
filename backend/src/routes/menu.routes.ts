import { Router } from 'express';
import { obtenerMenu } from '../controllers/menu.controller';

const router = Router();
router.get('/sucursales/:sucursalId/menu', obtenerMenu);

export default router;
