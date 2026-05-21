/**
 * Email Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../../core/auth.js';
import * as controller from './email.controller.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Contas de email
router.get('/accounts', controller.listEmails);
router.get('/accounts/:id', controller.getEmail);
router.post('/accounts', controller.createEmail);
router.put('/accounts/:id', controller.updateEmail);
router.delete('/accounts/:id', controller.deleteEmail);

// Estatísticas
router.get('/stats', controller.getStats);

export default router;
