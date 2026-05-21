/**
 * Auth - JWT e autenticação
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    tier: string;
}

export interface AuthRequest extends Request {
    user?: JWTPayload;
}

/**
 * Gera hash de senha
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

/**
 * Verifica senha
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Gera JWT token
 */
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica JWT token
 */
export function verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * Middleware de autenticação
 */
export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Token não fornecido' });
            return;
        }

        const token = authHeader.substring(7);
        const payload = verifyToken(token);

        // Verificar se usuário ainda existe
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, role: true, tier: true },
        });

        if (!user) {
            res.status(401).json({ error: 'Usuário não encontrado' });
            return;
        }

        // Atualizar payload com dados atuais
        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
            tier: user.tier
        };
        next();
    } catch (error) {
        logger.error('Erro na autenticação:', error);
        res.status(401).json({ error: 'Token inválido' });
    }
}

/**
 * Middleware de autorização por role
 */
export function requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Não autenticado' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Sem permissão' });
            return;
        }

        next();
    };
}
