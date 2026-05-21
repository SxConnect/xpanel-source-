/**
 * Users Controller
 */

import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { hashPassword, verifyPassword, generateToken, AuthRequest } from '../../core/auth.js';
import { z } from 'zod';

// Schemas de validação
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

/**
 * Registro de novo usuário
 */
export async function register(req: Request, res: Response) {
    try {
        const { email, password, name } = registerSchema.parse(req.body);

        // Verificar se email já existe
        const existing = await prisma.user.findUnique({
            where: { email },
        });

        if (existing) {
            res.status(400).json({ error: 'Email já cadastrado' });
            return;
        }

        // Criar usuário
        const hashedPassword = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'USER',
                tier: 'FREE',
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                tier: true,
                createdAt: true,
            },
        });

        // Gerar token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            tier: user.tier,
        });

        logger.info(`Novo usuário registrado: ${email}`);

        res.status(201).json({
            user,
            token,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        logger.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
}

/**
 * Login
 */
export async function login(req: Request, res: Response) {
    try {
        const { email, password } = loginSchema.parse(req.body);

        // Buscar usuário
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return;
        }

        // Verificar senha
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return;
        }

        // Atualizar último login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Gerar token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            tier: user.tier,
        });

        logger.info(`Login: ${email}`);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tier: user.tier,
            },
            token,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        logger.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
}

/**
 * Obter perfil do usuário autenticado
 */
export async function getProfile(req: AuthRequest, res: Response) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user?.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                tier: true,
                maxDomains: true,
                maxDatabases: true,
                maxContainers: true,
                maxEmails: true,
                diskQuotaMB: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'Usuário não encontrado' });
            return;
        }

        res.json({ user });
    } catch (error: any) {
        logger.error('Erro ao obter perfil:', error);
        res.status(500).json({ error: 'Erro ao obter perfil' });
    }
}

/**
 * Atualizar perfil
 */
export async function updateProfile(req: AuthRequest, res: Response) {
    try {
        const { name } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user?.userId },
            data: { name },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                tier: true,
            },
        });

        res.json({ user });
    } catch (error: any) {
        logger.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
}

/**
 * Listar todos os usuários (admin only)
 */
export async function listUsers(req: Request, res: Response) {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                tier: true,
                createdAt: true,
                lastLoginAt: true,
                _count: {
                    select: {
                        domains: true,
                        databases: true,
                        containers: true,
                        emails: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ users });
    } catch (error: any) {
        logger.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
}

/**
 * Criar novo usuário (ADMIN ou RESELLER PREMIUM)
 */
const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['USER', 'RESELLER']).optional(),
    tier: z.enum(['FREE', 'PREMIUM']).optional(),
});

export async function createUser(req: AuthRequest, res: Response) {
    try {
        const data = createUserSchema.parse(req.body);
        const creatorRole = req.user?.role;

        // Verificar se email já existe
        const existing = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existing) {
            res.status(400).json({ error: 'Email já cadastrado' });
            return;
        }

        // RESELLER só pode criar USER com tier FREE
        let role = data.role || 'USER';
        let tier = data.tier || 'FREE';

        if (creatorRole === 'RESELLER') {
            role = 'USER'; // RESELLER só pode criar USER
            tier = 'FREE'; // RESELLER só pode criar FREE
        }

        // ADMIN pode criar qualquer tipo
        // (role e tier já vêm do body se for ADMIN)

        // Criar usuário
        const hashedPassword = await hashPassword(data.password);
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role,
                tier,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                tier: true,
                createdAt: true,
            },
        });

        logger.info(`Novo usuário criado por ${req.user?.email}: ${data.email}`);

        res.status(201).json({ user });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        logger.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
}

/**
 * Atualizar usuário (ADMIN ou RESELLER PREMIUM)
 */
const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    role: z.enum(['USER', 'RESELLER', 'ADMIN']).optional(),
    tier: z.enum(['FREE', 'PREMIUM']).optional(),
    maxDomains: z.number().optional(),
    maxDatabases: z.number().optional(),
    maxContainers: z.number().optional(),
    maxEmails: z.number().optional(),
});

export async function updateUser(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const data = updateUserSchema.parse(req.body);
        const updaterRole = req.user?.role;

        // RESELLER não pode alterar role ou tier
        if (updaterRole === 'RESELLER') {
            delete data.role;
            delete data.tier;
            delete data.maxDomains;
            delete data.maxDatabases;
            delete data.maxContainers;
            delete data.maxEmails;
        }

        const user = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                tier: true,
                maxDomains: true,
                maxDatabases: true,
                maxContainers: true,
                maxEmails: true,
            },
        });

        logger.info(`Usuário atualizado por ${req.user?.email}: ${user.email}`);

        res.json({ user });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        logger.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
}

/**
 * Deletar usuário (ADMIN apenas)
 */
export async function deleteUser(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        // Não pode deletar a si mesmo
        if (id === req.user?.userId) {
            res.status(400).json({ error: 'Não é possível deletar sua própria conta' });
            return;
        }

        await prisma.user.delete({
            where: { id },
        });

        logger.info(`Usuário deletado por ${req.user?.email}: ${id}`);

        res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error: any) {
        logger.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
}
