/**
 * Prisma Client - Singleton
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: [
            { level: 'warn', emit: 'event' },
            { level: 'error', emit: 'event' },
        ],
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}

// Log de erros do Prisma
prisma.$on('warn', (e) => {
    logger.warn('Prisma warning:', e);
});

prisma.$on('error', (e) => {
    logger.error('Prisma error:', e);
});
