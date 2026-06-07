import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

import { logger } from './utils/logger';
import mongoose from 'mongoose';

// Handle global exceptions before anything else
process.on('uncaughtException', (error) => {
  logger.error('CRITICAL: Uncaught Exception detected! Server shutting down...', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('CRITICAL: Unhandled Promise Rejection detected! Server shutting down...', reason);
  process.exit(1);
});

// Enforce critical environment variables
if (!process.env.JWT_SECRET) {
  logger.error('CRITICAL ERROR: JWT_SECRET environment variable is missing.');
  process.exit(1);
}
if (!process.env.JWT_REFRESH_SECRET) {
  logger.error('CRITICAL ERROR: JWT_REFRESH_SECRET environment variable is missing.');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  logger.error('CRITICAL ERROR: MONGODB_URI environment variable is missing.');
  process.exit(1);
}

import app from './app';
import { connectDB } from './config/db';
import { syncAllUsers } from './utils/emailSyncService';

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`=============================================`);
    logger.info(`  LIQIFIN Backend running in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`  Access Local API: http://localhost:${PORT}`);
    logger.info(`=============================================`);
  });

  // Start background email synchronizer (every 2 minutes)
  logger.info('[EmailSync] Starting background email sync service (2-minute intervals)...');
  
  // Trigger initial run asynchronously after startup
  const initialTimeout = setTimeout(() => {
    syncAllUsers().catch(err => logger.error('[EmailSync] Initial sync error:', err));
  }, 5000);

  const syncInterval = setInterval(() => {
    syncAllUsers().catch(err => logger.error('[EmailSync] Background sync error:', err));
  }, 2 * 60 * 1000);

  // Handle graceful shutdowns
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    clearTimeout(initialTimeout);
    clearInterval(syncInterval);

    // Force exit after 10 seconds timeout
    const forceExitTimeout = setTimeout(() => {
      logger.warn('Forced shutdown: Clean exit took too long.');
      process.exit(1);
    }, 10000);

    // Stop accepting requests
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        // Close DB connections
        await mongoose.connection.close(false);
        logger.info('MongoDB connection closed.');
        clearTimeout(forceExitTimeout);
        process.exit(0);
      } catch (err) {
        logger.error('Error during DB connection close:', err);
        clearTimeout(forceExitTimeout);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch(err => {
  logger.error('Fatal server startup error:', err);
  process.exit(1);
});

