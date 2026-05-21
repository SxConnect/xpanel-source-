/**
 * Email Controller - Gerenciamento de contas de email
 */

import { Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { AuthRequest, hashPassword } from '../../core/auth.js';
import { checkResourceLimit } from '../../core/tier-check.js';
import { z } from 'zod';

// Schemas de validação
const createEmailSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    quotaMB: z.number().min(100).default(1024),
    forwardTo: z.string().email().optional(),
});

const updateEmailSchema = z.object({
    password: z.string().min(8).optional(),
    quotaMB: z.number().min(100).optional(),
    forwardTo: z.string().email().optional().nullable(),
    enabled: z.boolean().optional(),
});

/**
 * Lista todas as contas de email do usuário
 */
export async function listEmails(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        const emails = await prisma.emailAccount.findMany({
            where: isAdmin ? {} : { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Não retornar senhas
        const sanitized = emails.map(({ password, ...email }) => email);

        res.json({ emails: sanitized });
    } catch (error: any) {
        logger.error('Erro ao listar emails:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Obtém detalhes de uma conta de email
 */
export async function getEmail(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        const email = await prisma.emailAccount.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });

        if (!email) {
            res.status(404).json({ error: 'Conta de email não encontrada' });
            return;
        }

        // Verificar permissão
        if (!isAdmin && email.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        // Não retornar senha
        const { password, ...sanitized } = email;

        res.json({ email: sanitized });
    } catch (error: any) {
        logger.error('Erro ao obter email:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Cria uma nova conta de email
 */
export async function createEmail(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId!;
        const data = createEmailSchema.parse(req.body);

        // Verificar limites do usuário
        const limitCheck = await checkResourceLimit(userId, 'emails', prisma);

        if (!limitCheck.allowed) {
            res.status(403).json({
                error: 'Limite atingido',
                message: limitCheck.message,
                current: limitCheck.current,
                limit: limitCheck.limit,
                upgradeUrl: '/upgrade'
            });
            return;
        }

        // Verificar se email já existe
        const existing = await prisma.emailAccount.findUnique({
            where: { email: data.email },
        });

        if (existing) {
            res.status(400).json({ error: 'Email já cadastrado' });
            return;
        }

        // Hash da senha
        const hashedPassword = await hashPassword(data.password);

        // Criar conta
        const email = await prisma.emailAccount.create({
            data: {
                ...data,
                password: hashedPassword,
                userId,
            } as any,
        });

        // TODO: Criar conta no Postfix/Dovecot
        // TODO: Configurar DKIM, SPF, DMARC

        logger.info(`Conta de email criada: ${data.email} por ${req.user?.email}`);

        // Não retornar senha
        const { password, ...sanitized } = email;

        res.status(201).json({ email: sanitized });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        logger.error('Erro ao criar email:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Atualiza uma conta de email
 */
export async function updateEmail(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';
        const data = updateEmailSchema.parse(req.body);

        // Verificar permissão
        const existing = await prisma.emailAccount.findUnique({
            where: { id },
        });

        if (!existing) {
            res.status(404).json({ error: 'Conta de email não encontrada' });
            return;
        }

        if (!isAdmin && existing.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        // Hash da senha se fornecida
        const updateData: any = { ...data };
        if (data.password) {
            updateData.password = await hashPassword(data.password);
        }

        // Atualizar
        const email = await prisma.emailAccount.update({
            where: { id },
            data: updateData,
        });

        // TODO: Atualizar conta no Postfix/Dovecot

        logger.info(`Conta de email atualizada: ${email.email}`);

        // Não retornar senha
        const { password, ...sanitized } = email;

        res.json({ email: sanitized });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        logger.error('Erro ao atualizar email:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Remove uma conta de email
 */
export async function deleteEmail(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        // Verificar permissão
        const email = await prisma.emailAccount.findUnique({
            where: { id },
        });

        if (!email) {
            res.status(404).json({ error: 'Conta de email não encontrada' });
            return;
        }

        if (!isAdmin && email.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        // Remover
        await prisma.emailAccount.delete({
            where: { id },
        });

        // TODO: Remover conta do Postfix/Dovecot

        logger.info(`Conta de email removida: ${email.email}`);

        res.json({ message: 'Conta de email removida' });
    } catch (error: any) {
        logger.error('Erro ao remover email:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Obtém estatísticas de email
 */
export async function getStats(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        const where = isAdmin ? {} : { userId };

        const [totalEmails, enabledEmails, totalQuotaMB, totalUsedMB] = await Promise.all([
            prisma.emailAccount.count({ where }),
            prisma.emailAccount.count({ where: { ...where, enabled: true } }),
            prisma.emailAccount.aggregate({
                where,
                _sum: { quotaMB: true },
            }),
            prisma.emailAccount.aggregate({
                where,
                _sum: { usedMB: true },
            }),
        ]);

        res.json({
            totalEmails,
            enabledEmails,
            totalQuotaMB: totalQuotaMB._sum.quotaMB || 0,
            totalUsedMB: totalUsedMB._sum.usedMB || 0,
        });
    } catch (error: any) {
        logger.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: error.message });
    }
}
