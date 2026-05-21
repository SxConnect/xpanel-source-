/**
 * Docker Controller
 */

import { Request, Response } from 'express';
import { DockerAdapter } from '../../adapters/docker.js';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { AuthRequest } from '../../core/auth.js';

const docker = new DockerAdapter();

/**
 * Lista todos os containers
 */
export async function listContainers(req: AuthRequest, res: Response) {
    try {
        const { all } = req.query;
        const containers = await docker.listContainers(all === 'true');

        // Enriquecer com dados do banco
        const enriched = await Promise.all(
            containers.map(async (c) => {
                const dbContainer = await prisma.container.findUnique({
                    where: { dockerId: c.id },
                    select: { appName: true, appCategory: true, userId: true },
                });

                return {
                    ...c,
                    appName: dbContainer?.appName,
                    appCategory: dbContainer?.appCategory,
                    isOwned: dbContainer?.userId === req.user?.userId,
                };
            })
        );

        res.json({ containers: enriched });
    } catch (error: any) {
        logger.error('Erro ao listar containers:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Inspeciona um container
 */
export async function inspectContainer(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const details = await docker.inspectContainer(id);
        res.json(details);
    } catch (error: any) {
        logger.error('Erro ao inspecionar container:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Inicia um container
 */
export async function startContainer(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        // Verificar permissão
        const container = await prisma.container.findUnique({
            where: { dockerId: id },
        });

        if (container && container.userId !== req.user?.userId && req.user?.role !== 'ADMIN') {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        await docker.startContainer(id);

        // Atualizar banco
        if (container) {
            await prisma.container.update({
                where: { dockerId: id },
                data: {
                    status: 'RUNNING',
                    startedAt: new Date(),
                },
            });
        }

        res.json({ message: 'Container iniciado' });
    } catch (error: any) {
        logger.error('Erro ao iniciar container:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Para um container
 */
export async function stopContainer(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        // Verificar permissão
        const container = await prisma.container.findUnique({
            where: { dockerId: id },
        });

        if (container && container.userId !== req.user?.userId && req.user?.role !== 'ADMIN') {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        await docker.stopContainer(id);

        // Atualizar banco
        if (container) {
            await prisma.container.update({
                where: { dockerId: id },
                data: {
                    status: 'STOPPED',
                    stoppedAt: new Date(),
                },
            });
        }

        res.json({ message: 'Container parado' });
    } catch (error: any) {
        logger.error('Erro ao parar container:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Reinicia um container
 */
export async function restartContainer(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        // Verificar permissão
        const container = await prisma.container.findUnique({
            where: { dockerId: id },
        });

        if (container && container.userId !== req.user?.userId && req.user?.role !== 'ADMIN') {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        await docker.restartContainer(id);

        res.json({ message: 'Container reiniciado' });
    } catch (error: any) {
        logger.error('Erro ao reiniciar container:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Remove um container
 */
export async function removeContainer(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const { force } = req.query;

        // Verificar permissão
        const container = await prisma.container.findUnique({
            where: { dockerId: id },
        });

        if (container && container.userId !== req.user?.userId && req.user?.role !== 'ADMIN') {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        await docker.removeContainer(id, force === 'true');

        // Remover do banco
        if (container) {
            await prisma.container.delete({
                where: { dockerId: id },
            });
        }

        res.json({ message: 'Container removido' });
    } catch (error: any) {
        logger.error('Erro ao remover container:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Obtém logs de um container
 */
export async function getContainerLogs(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { tail } = req.query;
        const logs = await docker.getContainerLogs(id, tail ? parseInt(tail as string) : 100);
        res.json({ logs });
    } catch (error: any) {
        logger.error('Erro ao obter logs:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Obtém estatísticas de um container
 */
export async function getContainerStats(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const stats = await docker.getContainerStats(id);
        res.json(stats);
    } catch (error: any) {
        logger.error('Erro ao obter stats:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Lista imagens
 */
export async function listImages(req: Request, res: Response) {
    try {
        const images = await docker.listImages();
        res.json({ images });
    } catch (error: any) {
        logger.error('Erro ao listar imagens:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Lista redes
 */
export async function listNetworks(req: Request, res: Response) {
    try {
        const networks = await docker.listNetworks();
        res.json({ networks });
    } catch (error: any) {
        logger.error('Erro ao listar redes:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Lista volumes
 */
export async function listVolumes(req: Request, res: Response) {
    try {
        const volumes = await docker.listVolumes();
        res.json({ volumes });
    } catch (error: any) {
        logger.error('Erro ao listar volumes:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Health check do Docker
 */
export async function dockerPing(req: Request, res: Response) {
    try {
        const isAlive = await docker.ping();
        res.json({ status: isAlive ? 'ok' : 'error' });
    } catch (error: any) {
        logger.error('Erro no ping do Docker:', error);
        res.status(500).json({ error: error.message });
    }
}
