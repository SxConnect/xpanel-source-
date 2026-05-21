/**
 * Hosting Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../../core/auth.js';
import * as controller from './hosting.controller.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Domínios
router.get('/domains', controller.listDomains);
router.get('/domains/:id', controller.getDomain);
router.post('/domains', controller.createDomain);
router.put('/domains/:id', controller.updateDomain);
router.delete('/domains/:id', controller.deleteDomain);

// SSL
router.post('/domains/:id/ssl/enable', controller.enableSSL);
router.post('/domains/:id/ssl/disable', controller.disableSSL);

// Estatísticas
router.get('/stats', controller.getStats);

export default router;
