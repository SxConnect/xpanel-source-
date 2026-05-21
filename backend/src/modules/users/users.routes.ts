/**
 * Users Routes
 */

import { Router } from 'express';
import { authMiddleware, requireRole } from '../../core/auth.js';
import { canManageUsers } from '../../core/tier-check.js';
import * as controller from './users.controller.js';

const router = Router();

// Rotas públicas
router.post('/register', controller.register);
router.post('/login', controller.login);

// Rotas autenticadas
router.get('/profile', authMiddleware, controller.getProfile);
router.put('/profile', authMiddleware, controller.updateProfile);

// Rotas de gerenciamento de usuários (ADMIN ou RESELLER PREMIUM)
router.get('/', authMiddleware, canManageUsers, controller.listUsers);
router.post('/create', authMiddleware, canManageUsers, controller.createUser);
router.put('/:id', authMiddleware, canManageUsers, controller.updateUser);
router.delete('/:id', authMiddleware, requireRole('ADMIN'), controller.deleteUser);

export default router;
