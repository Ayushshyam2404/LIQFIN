import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const getHealth = async (req: Request, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState;
    let dbStatus = 'disconnected';
    if (dbState === 1) dbStatus = 'connected';
    else if (dbState === 2) dbStatus = 'connecting';
    else if (dbState === 3) dbStatus = 'disconnecting';

    const healthData: Record<string, unknown> = {
      status: dbState === 1 ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus
      }
    };

    const statusCode = dbState === 1 ? 200 : 503;
    res.status(statusCode).json(healthData);
  } catch (error) {
    logger.error('[healthCheck] Failed to collect health data', error);
    res.status(500).json({ status: 'ERROR', message: 'Health check failed' });
  }
};
