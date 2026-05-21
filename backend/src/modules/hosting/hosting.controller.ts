/**
 * Hosting Controller - Gerenciamento de domínios e sites
 */

import { Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { AuthRequest } from '../../core/auth.js';
import { checkResourceLimit } from '../../core/tier-check.js';
import { z } from 'zod';

// Schemas de validação
const createDomainSchema = z.object({
    domain: z.string().min(3),
    type: z.enum(['SITE', 'CONTAINER']),
    phpVersion: z.string().optional(),
    documentRoot: z.string().optional(),
    containerId: z.string().optional(),
    containerPort: z.number().optional(),
});

const updateDomainSchema = z.object({
    phpVersion: z.string().optional(),
    documentRoot: z.string().optional(),
    sslEnabled: z.boolean().optional(),
});

/**
 * Lista todos os domínios do usuário
 */
export async function listDomains(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        const domains = await prisma.domain.findMany({
            where: isAdmin ? {} : { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                dnsRecords: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ domains });
    } catch (error: any) {
        logger.error('Erro ao listar domínios:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Obtém detalhes de um domínio
 */
export async function getDomain(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        const domain = await prisma.domain.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                dnsRecords: true,
            },
        });

        if (!domain) {
            res.status(404).json({ error: 'Domínio não encontrado' });
            return;
        }

        // Verificar permissão
        if (!isAdmin && domain.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        res.json({ domain });
    } catch (error: any) {
        logger.error('Erro ao obter domínio:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Cria um novo domínio
 */
export async function createDomain(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId!;
        const data = createDomainSchema.parse(req.body);

        // Verificar limites do usuário
        const limitCheck = await checkResourceLimit(userId, 'domains', prisma);

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

        // Verificar se domínio já existe
        const existing = await prisma.domain.findUnique({
            where: { domain: data.domain },
        });

        if (existing) {
            res.status(400).json({ error: 'Domínio já cadastrado' });
            return;
        }

        // Criar domínio
        const domain = await prisma.domain.create({
            data: {
                ...data,
                userId,
                status: 'PENDING',
            } as any,
        });

        // TODO: Configurar Nginx/Traefik automaticamente
        // TODO: Emitir SSL via Let's Encrypt

        logger.info(`Domínio criado: ${data.domain} por ${req.user?.email}`);

        res.status(201).json({ domain });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        logger.error('Erro ao criar domínio:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Atualiza um domínio
 */
export async function updateDomain(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';
        const data = updateDomainSchema.parse(req.body);

        // Verificar permissão
        const existing = await prisma.domain.findUnique({
            where: { id },
        });

        if (!existing) {
            res.status(404).json({ error: 'Domínio não encontrado' });
            return;
        }

        if (!isAdmin && existing.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        // Atualizar
        const domain = await prisma.domain.update({
            where: { id },
            data,
        });

        // TODO: Reconfigurar Nginx/Traefik se necessário
        // TODO: Renovar SSL se habilitado

        logger.info(`Domínio atualizado: ${domain.domain}`);

        res.json({ domain });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        logger.error('Erro ao atualizar domínio:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Remove um domínio
 */
export async function deleteDomain(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        // Verificar permissão
        const domain = await prisma.domain.findUnique({
            where: { id },
        });

        if (!domain) {
            res.status(404).json({ error: 'Domínio não encontrado' });
            return;
        }

        if (!isAdmin && domain.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        // Remover
        await prisma.domain.delete({
            where: { id },
        });

        // TODO: Remover configuração Nginx/Traefik
        // TODO: Revogar certificado SSL

        logger.info(`Domínio removido: ${domain.domain}`);

        res.json({ message: 'Domínio removido' });
    } catch (error: any) {
        logger.error('Erro ao remover domínio:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Habilita SSL para um domínio
 */
export async function enableSSL(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        // Verificar permissão
        const domain = await prisma.domain.findUnique({
            where: { id },
        });

        if (!domain) {
            res.status(404).json({ error: 'Domínio não encontrado' });
            return;
        }

        if (!isAdmin && domain.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        // TODO: Emitir certificado via Let's Encrypt
        // TODO: Configurar Nginx/Traefik para usar SSL

        // Simular emissão de certificado
        const sslExpiresAt = new Date();
        sslExpiresAt.setDate(sslExpiresAt.getDate() + 90); // 90 dias

        const updated = await prisma.domain.update({
            where: { id },
            data: {
                sslEnabled: true,
                sslProvider: 'letsencrypt',
                sslExpiresAt,
            },
        });

        logger.info(`SSL habilitado para: ${domain.domain}`);

        res.json({ domain: updated });
    } catch (error: any) {
        logger.error('Erro ao habilitar SSL:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Desabilita SSL para um domínio
 */
export async function disableSSL(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        // Verificar permissão
        const domain = await prisma.domain.findUnique({
            where: { id },
        });

        if (!domain) {
            res.status(404).json({ error: 'Domínio não encontrado' });
            return;
        }

        if (!isAdmin && domain.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        // TODO: Remover configuração SSL do Nginx/Traefik

        const updated = await prisma.domain.update({
            where: { id },
            data: {
                sslEnabled: false,
                sslProvider: null,
                sslExpiresAt: null,
            },
        });

        logger.info(`SSL desabilitado para: ${domain.domain}`);

        res.json({ domain: updated });
    } catch (error: any) {
        logger.error('Erro ao desabilitar SSL:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Obtém estatísticas de hospedagem
 */
export async function getStats(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        const where = isAdmin ? {} : { userId };

        const [totalDomains, activeDomains, sslEnabled, siteType, containerType] = await Promise.all([
            prisma.domain.count({ where }),
            prisma.domain.count({ where: { ...where, status: 'ACTIVE' } }),
            prisma.domain.count({ where: { ...where, sslEnabled: true } }),
            prisma.domain.count({ where: { ...where, type: 'SITE' } }),
            prisma.domain.count({ where: { ...where, type: 'CONTAINER' } }),
        ]);

        res.json({
            totalDomains,
            activeDomains,
            sslEnabled,
            byType: {
                site: siteType,
                container: containerType,
            },
        });
    } catch (error: any) {
        logger.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: error.message });
    }
}
