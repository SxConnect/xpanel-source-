/**
 * DNS Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../../core/auth.js';
import * as controller from './dns.controller.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Registros DNS
router.get('/domains/:domainId/records', controller.listRecords);
router.get('/records/:id', controller.getRecord);
router.post('/records', controller.createRecord);
router.put('/records/:id', controller.updateRecord);
router.delete('/records/:id', controller.deleteRecord);

// Utilitários
router.post('/domains/:domainId/records/defaults', controller.createDefaultRecords);

export default router;
