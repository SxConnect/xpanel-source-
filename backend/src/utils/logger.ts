/**
 * Logger - Winston configurado
 */

import winston from 'winston';
import path from 'path';

const logDir = process.env.LOG_FILE || 'logs/xpanel.log';

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'xpanel' },
    transports: [
        // Console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `${timestamp} ${level} ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
                        }`;
                })
            ),
        }),
        // File
        new winston.transports.File({
            filename: logDir,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
        }),
    ],
});
