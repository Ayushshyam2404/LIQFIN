import { Request, Response } from 'express';
import mongoose from 'mongoose';
import os from 'os';

export const getHealth = async (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus = 'disconnected';
  if (dbState === 1) dbStatus = 'connected';
  else if (dbState === 2) dbStatus = 'connecting';
  else if (dbState === 3) dbStatus = 'disconnecting';

  const memoryUsage = process.memoryUsage();
  
  const healthData = {
    status: dbState === 1 ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
      totalMemoryGB: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
      freeMemoryGB: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
      cpuLoad: os.loadavg()
    },
    database: {
      status: dbStatus,
      readyState: dbState
    },
    process: {
      memoryRSS_MB: (memoryUsage.rss / 1024 / 1024).toFixed(2),
      memoryHeapUsed_MB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      memoryHeapTotal_MB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2)
    }
  };

  const statusCode = dbState === 1 ? 200 : 503;
  res.status(statusCode).json(healthData);
};
