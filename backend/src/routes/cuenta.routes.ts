import { Router } from 'express';
import { cambiarMiClave } from '../controllers/clave.controller';
import { requireAuth } from '../middlewares/auth';
import { limitadorLogin } from '../middlewares/limitador';

const router = Router();
// Mismo límite que el login: frena a quien intente adivinar la clave actual
router.put('/auth/password', requireAuth, limitadorLogin, cambiarMiClave);

export default router;
