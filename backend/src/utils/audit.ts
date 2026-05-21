/**
 * Audit Helper - Registra ações dos usuários
 */

import { prisma } from './prisma.js';
import { logger } from './logger.js';

export async function logAction(
    userId: string,
    action: string,
    resource?: string,
    details?: any,
    ip?: string,
    userAgent?: string
): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                resource,
                details,
                ip,
                userAgent,
            },
        });
    } catch (error) {
        logger.error('Erro ao registrar audit log:', error);
    }
}
