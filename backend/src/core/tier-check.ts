import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

/**
 * Middleware para verificar tier do usuário
 */
export function requireTier(requiredTier: 'PREMIUM') {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const userTier = req.user?.tier;

        if (!userTier) {
            res.status(401).json({ error: 'Não autenticado' });
            return;
        }

        if (userTier !== requiredTier) {
            res.status(403).json({
                error: 'Recurso premium',
                message: 'Este recurso requer uma conta Premium',
                requiredTier,
                currentTier: userTier,
                upgradeUrl: '/upgrade'
            });
            return;
        }

        next();
    };
}

/**
 * Middleware para verificar se usuário pode criar sub-usuários
 * Apenas ADMIN e RESELLER com tier PREMIUM podem criar usuários
 */
export function canManageUsers(req: AuthRequest, res: Response, next: NextFunction) {
    const userRole = req.user?.role;
    const userTier = req.user?.tier;

    if (!userRole || !userTier) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
    }

    // ADMIN sempre pode
    if (userRole === 'ADMIN') {
        next();
        return;
    }

    // RESELLER precisa de tier PREMIUM
    if (userRole === 'RESELLER' && userTier === 'PREMIUM') {
        next();
        return;
    }

    // USER não pode criar outros usuários
    res.status(403).json({
        error: 'Sem permissão',
        message: 'Apenas contas Premium com perfil Reseller podem gerenciar usuários',
        requiredRole: 'RESELLER',
        requiredTier: 'PREMIUM',
        currentRole: userRole,
        currentTier: userTier
    });
}

/**
 * Verifica limites de recursos baseado no tier
 */
export async function checkResourceLimit(
    userId: string,
    resourceType: 'domains' | 'databases' | 'containers' | 'emails',
    prisma: any
): Promise<{ allowed: boolean; message?: string; current?: number; limit?: number }> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            tier: true,
            maxDomains: true,
            maxDatabases: true,
            maxContainers: true,
            maxEmails: true,
            _count: {
                select: {
                    domains: true,
                    databases: true,
                    containers: true,
                    emails: true
                }
            }
        }
    });

    if (!user) {
        return { allowed: false, message: 'Usuário não encontrado' };
    }

    // PREMIUM tem recursos ilimitados (ou limites maiores)
    if (user.tier === 'PREMIUM') {
        const limits = {
            domains: user.maxDomains,
            databases: user.maxDatabases,
            containers: user.maxContainers,
            emails: user.maxEmails
        };

        const limit = limits[resourceType];

        // 0 = ilimitado
        if (limit === 0) {
            return { allowed: true };
        }

        const current = user._count[resourceType];

        if (current >= limit) {
            return {
                allowed: false,
                message: `Limite de ${resourceType} atingido`,
                current,
                limit
            };
        }

        return { allowed: true, current, limit };
    }

    // FREE tem limites restritos
    const freeLimits = {
        domains: 3,
        databases: 2,
        containers: 5,
        emails: 5
    };

    const limit = freeLimits[resourceType];
    const current = user._count[resourceType];

    if (current >= limit) {
        return {
            allowed: false,
            message: `Limite gratuito de ${resourceType} atingido (${limit}). Faça upgrade para Premium.`,
            current,
            limit
        };
    }

    return { allowed: true, current, limit };
}
