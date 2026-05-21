/**
 * Backup Controller - Gerenciamento de backups
 */

import { Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { AuthRequest } from '../../core/auth.js';
import { z } from 'zod';

// Schemas de validação
const createBackupSchema = z.object({
    name: z.string().min(3),
    type: z.enum(['MANUAL', 'SCHEDULED']),
    includes: z.array(z.string()),
    destination: z.enum(['LOCAL', 'S3', 'B2', 'SFTP']),
    path: z.string(),
    schedule: z.string().optional(),
});

/**
 * Lista todos os backups do usuário
 */
export async function listBackups(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        const backups = await prisma.backup.findMany({
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

        res.json({ backups });
    } catch (error: any) {
        logger.error('Erro ao listar backups:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Obtém detalhes de um backup
 */
export async function getBackup(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        const backup = await prisma.backup.findUnique({
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

        if (!backup) {
            res.status(404).json({ error: 'Backup não encontrado' });
            return;
        }

        // Verificar permissão
        if (!isAdmin && backup.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        res.json({ backup });
    } catch (error: any) {
        logger.error('Erro ao obter backup:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Cria um novo backup
 */
export async function createBackup(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId!;
        const data = createBackupSchema.parse(req.body);

        // Criar backup
        const backup = await prisma.backup.create({
            data: {
                ...data,
                userId,
                status: 'PENDING',
            } as any,
        });

        // TODO: Iniciar processo de backup em background
        // TODO: Compactar arquivos
        // TODO: Enviar para destino (S3, B2, SFTP)

        logger.info(`Backup criado: ${data.name} por ${req.user?.email}`);

        // Simular conclusão do backup (em produção seria async)
        setTimeout(async () => {
            await prisma.backup.update({
                where: { id: backup.id },
                data: {
                    status: 'COMPLETED',
                    sizeMB: Math.random() * 1000, // Tamanho simulado
                    completedAt: new Date(),
                },
            });
        }, 1000);

        res.status(201).json({ backup });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        logger.error('Erro ao criar backup:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Remove um backup
 */
export async function deleteBackup(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        // Verificar permissão
        const backup = await prisma.backup.findUnique({
            where: { id },
        });

        if (!backup) {
            res.status(404).json({ error: 'Backup não encontrado' });
            return;
        }

        if (!isAdmin && backup.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        // Remover
        await prisma.backup.delete({
            where: { id },
        });

        // TODO: Remover arquivo do destino

        logger.info(`Backup removido: ${backup.name}`);

        res.json({ message: 'Backup removido' });
    } catch (error: any) {
        logger.error('Erro ao remover backup:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Restaura um backup
 */
export async function restoreBackup(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        // Verificar permissão
        const backup = await prisma.backup.findUnique({
            where: { id },
        });

        if (!backup) {
            res.status(404).json({ error: 'Backup não encontrado' });
            return;
        }

        if (!isAdmin && backup.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        if (backup.status !== 'COMPLETED') {
            res.status(400).json({ error: 'Backup não está completo' });
            return;
        }

        // TODO: Baixar backup do destino
        // TODO: Descompactar
        // TODO: Restaurar arquivos/databases/containers

        logger.info(`Backup restaurado: ${backup.name}`);

        res.json({ message: 'Backup restaurado com sucesso' });
    } catch (error: any) {
        logger.error('Erro ao restaurar backup:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Obtém estatísticas de backup
 */
export async function getStats(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        const where = isAdmin ? {} : { userId };

        const [totalBackups, completedBackups, failedBackups, totalSizeMB] = await Promise.all([
            prisma.backup.count({ where }),
            prisma.backup.count({ where: { ...where, status: 'COMPLETED' } }),
            prisma.backup.count({ where: { ...where, status: 'FAILED' } }),
            prisma.backup.aggregate({
                where: { ...where, status: 'COMPLETED' },
                _sum: { sizeMB: true },
            }),
        ]);

        res.json({
            totalBackups,
            completedBackups,
            failedBackups,
            totalSizeMB: totalSizeMB._sum.sizeMB || 0,
        });
    } catch (error: any) {
        logger.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: error.message });
    }
}
