/**
 * XPanel - Entry Point
 * Painel de Controle Completo para VPS
 * by SX Connect
 */

import { config } from 'dotenv';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger.js';
import { prisma } from './utils/prisma.js';

// Rotas
import usersRoutes from './modules/users/users.routes.js';
import dockerRoutes from './modules/docker/docker.routes.js';
import hostingRoutes from './modules/hosting/hosting.routes.js';
import emailRoutes from './modules/email/email.routes.js';
import dnsRoutes from './modules/dns/dns.routes.js';
import backupRoutes from './modules/backup/backup.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

// Carrega variáveis de ambiente
config();

const app: Express = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '0.1.0',
    });
});

// Rotas da API
app.use('/api/users', usersRoutes);
app.use('/api/docker', dockerRoutes);
app.use('/api/hosting', hostingRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/dns', dnsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota 404
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
    logger.error('Erro não tratado:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicialização
async function bootstrap() {
    try {
        logger.info('🚀 Iniciando XPanel...');

        // Testar conexão com banco
        await prisma.$connect();
        logger.info('✅ Banco de dados conectado');

        // Criar usuário admin se não existir
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@xpanel.local';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const adminExists = await prisma.user.findUnique({
            where: { email: adminEmail },
        });

        if (!adminExists) {
            const { hashPassword } = await import('./core/auth.js');
            const hashedPassword = await hashPassword(adminPassword);

            await prisma.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    name: 'Administrator',
                    role: 'ADMIN',
                    tier: 'PREMIUM',
                },
            });

            logger.info(`✅ Usuário admin criado: ${adminEmail}`);
        }

        // Iniciar servidor
        app.listen(PORT, () => {
            logger.info('');
            logger.info('🎉 XPanel está pronto!');
            logger.info(`📱 API: http://${HOST}:${PORT}`);
            logger.info(`👤 Admin: ${adminEmail}`);
            logger.info('');
        });

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`\n⚠️  Recebido sinal ${signal}, encerrando...`);

            await prisma.$disconnect();

            logger.info('👋 XPanel encerrado com sucesso');
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.error('❌ Erro fatal ao iniciar XPanel:', error);
        process.exit(1);
    }
}

// Start
bootstrap();
