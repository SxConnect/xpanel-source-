/**
 * Backup Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../../core/auth.js';
import * as controller from './backup.controller.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Backups
router.get('/', controller.listBackups);
router.get('/:id', controller.getBackup);
router.post('/', controller.createBackup);
router.delete('/:id', controller.deleteBackup);

// Restore
router.post('/:id/restore', controller.restoreBackup);

// Estatísticas
router.get('/stats', controller.getStats);

export default router;
