import { Router } from 'express';
import { listar } from '../controllers/auditoria.controller';
import { requireAuth, requireRol } from '../middlewares/auth';

const router = Router();
router.get('/auditoria', requireAuth, requireRol('OWNER'), listar);

export default router;
