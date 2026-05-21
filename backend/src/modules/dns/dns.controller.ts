/**
 * DNS Controller - Gerenciamento de registros DNS
 */

import { Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { AuthRequest } from '../../core/auth.js';
import { z } from 'zod';

// Schemas de validação
const createRecordSchema = z.object({
    domainId: z.string().uuid(),
    type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SPF', 'DKIM', 'DMARC', 'CAA', 'SRV']),
    name: z.string(),
    value: z.string(),
    ttl: z.number().min(60).default(3600),
    priority: z.number().optional(),
});

const updateRecordSchema = z.object({
    name: z.string().optional(),
    value: z.string().optional(),
    ttl: z.number().min(60).optional(),
    priority: z.number().optional(),
});

/**
 * Lista todos os registros DNS de um domínio
 */
export async function listRecords(req: AuthRequest, res: Response) {
    try {
        const { domainId } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        // Verificar se domínio existe e usuário tem permissão
        const domain = await prisma.domain.findUnique({
            where: { id: domainId },
        });

        if (!domain) {
            res.status(404).json({ error: 'Domínio não encontrado' });
            return;
        }

        if (!isAdmin && domain.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        const records = await prisma.dnsRecord.findMany({
            where: { domainId },
            orderBy: [{ type: 'asc' }, { name: 'asc' }],
        });

        res.json({ records });
    } catch (error: any) {
        logger.error('Erro ao listar registros DNS:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Obtém detalhes de um registro DNS
 */
export async function getRecord(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        const record = await prisma.dnsRecord.findUnique({
            where: { id },
            include: {
                domain: true,
            },
        });

        if (!record) {
            res.status(404).json({ error: 'Registro DNS não encontrado' });
            return;
        }

        // Verificar permissão
        if (!isAdmin && record.domain.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        res.json({ record });
    } catch (error: any) {
        logger.error('Erro ao obter registro DNS:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Cria um novo registro DNS
 */
export async function createRecord(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';
        const data = createRecordSchema.parse(req.body);

        // Verificar se domínio existe e usuário tem permissão
        const domain = await prisma.domain.findUnique({
            where: { id: data.domainId },
        });

        if (!domain) {
            res.status(404).json({ error: 'Domínio não encontrado' });
            return;
        }

        if (!isAdmin && domain.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        // Criar registro
        const record = await prisma.dnsRecord.create({
            data: data as any,
        });

        // TODO: Aplicar mudanças no Bind9 ou Cloudflare API

        logger.info(`Registro DNS criado: ${data.type} ${data.name} para ${domain.domain}`);

        res.status(201).json({ record });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        logger.error('Erro ao criar registro DNS:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Atualiza um registro DNS
 */
export async function updateRecord(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';
        const data = updateRecordSchema.parse(req.body);

        // Verificar permissão
        const existing = await prisma.dnsRecord.findUnique({
            where: { id },
            include: { domain: true },
        });

        if (!existing) {
            res.status(404).json({ error: 'Registro DNS não encontrado' });
            return;
        }

        if (!isAdmin && existing.domain.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        // Atualizar
        const record = await prisma.dnsRecord.update({
            where: { id },
            data,
        });

        // TODO: Aplicar mudanças no Bind9 ou Cloudflare API

        logger.info(`Registro DNS atualizado: ${record.type} ${record.name}`);

        res.json({ record });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return;
        }
        logger.error('Erro ao atualizar registro DNS:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Remove um registro DNS
 */
export async function deleteRecord(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        // Verificar permissão
        const record = await prisma.dnsRecord.findUnique({
            where: { id },
            include: { domain: true },
        });

        if (!record) {
            res.status(404).json({ error: 'Registro DNS não encontrado' });
            return;
        }

        if (!isAdmin && record.domain.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        // Remover
        await prisma.dnsRecord.delete({
            where: { id },
        });

        // TODO: Aplicar mudanças no Bind9 ou Cloudflare API

        logger.info(`Registro DNS removido: ${record.type} ${record.name}`);

        res.json({ message: 'Registro DNS removido' });
    } catch (error: any) {
        logger.error('Erro ao remover registro DNS:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Cria registros DNS padrão para um domínio
 */
export async function createDefaultRecords(req: AuthRequest, res: Response) {
    try {
        const { domainId } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        // Verificar permissão
        const domain = await prisma.domain.findUnique({
            where: { id: domainId },
        });

        if (!domain) {
            res.status(404).json({ error: 'Domínio não encontrado' });
            return;
        }

        if (!isAdmin && domain.userId !== userId) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        // Obter IP do servidor (simulado)
        const serverIP = '192.168.1.1'; // TODO: Obter IP real do servidor

        // Criar registros padrão
        const defaultRecords = [
            { type: 'A', name: '@', value: serverIP, ttl: 3600 },
            { type: 'A', name: 'www', value: serverIP, ttl: 3600 },
            { type: 'MX', name: '@', value: `mail.${domain.domain}`, ttl: 3600, priority: 10 },
            { type: 'TXT', name: '@', value: 'v=spf1 mx ~all', ttl: 3600 },
        ];

        const created = await Promise.all(
            defaultRecords.map((record) =>
                prisma.dnsRecord.create({
                    data: {
                        ...record,
                        domainId,
                        type: record.type as any,
                    },
                })
            )
        );

        logger.info(`Registros DNS padrão criados para: ${domain.domain}`);

        res.status(201).json({ records: created });
    } catch (error: any) {
        logger.error('Erro ao criar registros padrão:', error);
        res.status(500).json({ error: error.message });
    }
}
