import { Router } from 'express';
import * as c from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth';
import { limitadorLogin } from '../middlewares/limitador';

const router = Router();

router.post('/auth/login', limitadorLogin, c.login);
router.post('/auth/logout', c.logout);
router.get('/auth/me', requireAuth, c.yo);

export default router;
