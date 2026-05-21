/**
 * Dashboard Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../../core/auth.js';
import * as controller from './dashboard.controller.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Dashboard
router.get('/stats', controller.getStats);
router.get('/activity', controller.getRecentActivity);
router.get('/usage', controller.getResourceUsage);
router.get('/alerts', controller.getAlerts);

export default router;
