/**
 * Docker Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../../core/auth.js';
import * as controller from './docker.controller.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Containers
router.get('/containers', controller.listContainers);
router.get('/containers/:id', controller.inspectContainer);
router.post('/containers/:id/start', controller.startContainer);
router.post('/containers/:id/stop', controller.stopContainer);
router.post('/containers/:id/restart', controller.restartContainer);
router.delete('/containers/:id', controller.removeContainer);
router.get('/containers/:id/logs', controller.getContainerLogs);
router.get('/containers/:id/stats', controller.getContainerStats);

// Imagens
router.get('/images', controller.listImages);

// Redes
router.get('/networks', controller.listNetworks);

// Volumes
router.get('/volumes', controller.listVolumes);

// Health
router.get('/ping', controller.dockerPing);

export default router;
