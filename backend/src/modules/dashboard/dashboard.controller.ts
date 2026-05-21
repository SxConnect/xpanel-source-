/**
 * Dashboard Controller - Estatísticas gerais do sistema
 */

import { Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { AuthRequest } from '../../core/auth.js';
import { DockerAdapter } from '../../adapters/docker.js';
import os from 'os';

const docker = new DockerAdapter();

/**
 * Obtém estatísticas gerais do dashboard
 */
export async function getStats(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        const where = isAdmin ? {} : { userId };

        // Estatísticas do banco
        const [
            totalDomains,
            totalDatabases,
            totalContainers,
            totalEmails,
            totalBackups,
            recentBackups,
        ] = await Promise.all([
            prisma.domain.count({ where }),
            prisma.database.count({ where }),
            prisma.container.count({ where }),
            prisma.emailAccount.count({ where }),
            prisma.backup.count({ where }),
            prisma.backup.findMany({
                where,
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    sizeMB: true,
                    createdAt: true,
                },
            }),
        ]);

        // Estatísticas do servidor
        const serverStats = {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemoryGB: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
            freeMemoryGB: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
            uptime: os.uptime(),
            loadAverage: os.loadavg(),
        };

        // Estatísticas do Docker
        let dockerStats = null;
        try {
            const dockerAlive = await docker.ping();
            if (dockerAlive) {
                const containers = await docker.listContainers(true);
                const images = await docker.listImages();
                const networks = await docker.listNetworks();
                const volumes = await docker.listVolumes();

                dockerStats = {
                    containers: {
                        total: containers.length,
                        running: containers.filter((c) => c.state === 'running').length,
                        stopped: containers.filter((c) => c.state === 'exited').length,
                    },
                    images: images.length,
                    networks: networks.length,
                    volumes: volumes.length,
                };
            }
        } catch (error) {
            logger.warn('Docker não disponível');
        }

        res.json({
            resources: {
                domains: totalDomains,
                databases: totalDatabases,
                containers: totalContainers,
                emails: totalEmails,
                backups: totalBackups,
            },
            server: serverStats,
            docker: dockerStats,
            recentBackups,
        });
    } catch (error: any) {
        logger.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Obtém atividades recentes
 */
export async function getRecentActivity(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        const where = isAdmin ? {} : { userId };

        const activities = await prisma.auditLog.findMany({
            where,
            take: 20,
            orderBy: { createdAt: 'desc' },
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

        res.json({ activities });
    } catch (error: any) {
        logger.error('Erro ao obter atividades:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Obtém uso de recursos do usuário
 */
export async function getResourceUsage(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId!;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        domains: true,
                        databases: true,
                        containers: true,
                        emails: true,
                    },
                },
            },
        });

        if (!user) {
            res.status(404).json({ error: 'Usuário não encontrado' });
            return;
        }

        const usage = {
            domains: {
                used: user._count.domains,
                limit: user.maxDomains,
                unlimited: user.maxDomains === 0,
            },
            databases: {
                used: user._count.databases,
                limit: user.maxDatabases,
                unlimited: user.maxDatabases === 0,
            },
            containers: {
                used: user._count.containers,
                limit: user.maxContainers,
                unlimited: user.maxContainers === 0,
            },
            emails: {
                used: user._count.emails,
                limit: user.maxEmails,
                unlimited: user.maxEmails === 0,
            },
            disk: {
                used: 0, // TODO: Calcular uso real de disco
                limit: user.diskQuotaMB,
                unlimited: user.diskQuotaMB === 0,
            },
        };

        res.json({ usage });
    } catch (error: any) {
        logger.error('Erro ao obter uso de recursos:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Obtém alertas do sistema
 */
export async function getAlerts(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';

        const alerts: any[] = [];

        // Verificar SSL expirando
        const expiringSSL = await prisma.domain.findMany({
            where: {
                userId: isAdmin ? undefined : userId,
                sslEnabled: true,
                sslExpiresAt: {
                    lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
                },
            },
            select: {
                id: true,
                domain: true,
                sslExpiresAt: true,
            },
        });

        expiringSSL.forEach((domain) => {
            alerts.push({
                type: 'warning',
                category: 'ssl',
                message: `SSL do domínio ${domain.domain} expira em breve`,
                data: domain,
            });
        });

        // Verificar backups falhados
        const failedBackups = await prisma.backup.count({
            where: {
                userId: isAdmin ? undefined : userId,
                status: 'FAILED',
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias
                },
            },
        });

        if (failedBackups > 0) {
            alerts.push({
                type: 'error',
                category: 'backup',
                message: `${failedBackups} backup(s) falharam nos últimos 7 dias`,
            });
        }

        // Verificar containers parados
        const stoppedContainers = await prisma.container.count({
            where: {
                userId: isAdmin ? undefined : userId,
                status: 'STOPPED',
            },
        });

        if (stoppedContainers > 0) {
            alerts.push({
                type: 'info',
                category: 'docker',
                message: `${stoppedContainers} container(s) parado(s)`,
            });
        }

        res.json({ alerts });
    } catch (error: any) {
        logger.error('Erro ao obter alertas:', error);
        res.status(500).json({ error: error.message });
    }
}
