"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const logger_1 = require("./utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
// Handle global exceptions before anything else
process.on('uncaughtException', (error) => {
    logger_1.logger.error('CRITICAL: Uncaught Exception detected! Server shutting down...', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('CRITICAL: Unhandled Promise Rejection detected! Server shutting down...', reason);
    process.exit(1);
});
// Enforce critical environment variables
if (!process.env.JWT_SECRET) {
    logger_1.logger.error('CRITICAL ERROR: JWT_SECRET environment variable is missing.');
    process.exit(1);
}
if (!process.env.JWT_REFRESH_SECRET) {
    logger_1.logger.error('CRITICAL ERROR: JWT_REFRESH_SECRET environment variable is missing.');
    process.exit(1);
}
if (!process.env.MONGODB_URI) {
    logger_1.logger.error('CRITICAL ERROR: MONGODB_URI environment variable is missing.');
    process.exit(1);
}
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const emailSyncService_1 = require("./utils/emailSyncService");
const PORT = process.env.PORT || 5001;
const startServer = async () => {
    // Connect to Database
    await (0, db_1.connectDB)();
    const server = app_1.default.listen(PORT, () => {
        logger_1.logger.info(`=============================================`);
        logger_1.logger.info(`  LIQIFIN Backend running in ${process.env.NODE_ENV || 'development'} mode`);
        logger_1.logger.info(`  Access Local API: http://localhost:${PORT}`);
        logger_1.logger.info(`=============================================`);
    });
    // Start background email synchronizer (every 2 minutes)
    logger_1.logger.info('[EmailSync] Starting background email sync service (2-minute intervals)...');
    // Trigger initial run asynchronously after startup
    const initialTimeout = setTimeout(() => {
        (0, emailSyncService_1.syncAllUsers)().catch(err => logger_1.logger.error('[EmailSync] Initial sync error:', err));
    }, 5000);
    const syncInterval = setInterval(() => {
        (0, emailSyncService_1.syncAllUsers)().catch(err => logger_1.logger.error('[EmailSync] Background sync error:', err));
    }, 2 * 60 * 1000);
    // Handle graceful shutdowns
    const shutdown = async (signal) => {
        logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
        clearTimeout(initialTimeout);
        clearInterval(syncInterval);
        // Force exit after 10 seconds timeout
        const forceExitTimeout = setTimeout(() => {
            logger_1.logger.warn('Forced shutdown: Clean exit took too long.');
            process.exit(1);
        }, 10000);
        // Stop accepting requests
        server.close(async () => {
            logger_1.logger.info('HTTP server closed.');
            try {
                // Close DB connections
                await mongoose_1.default.connection.close(false);
                logger_1.logger.info('MongoDB connection closed.');
                clearTimeout(forceExitTimeout);
                process.exit(0);
            }
            catch (err) {
                logger_1.logger.error('Error during DB connection close:', err);
                clearTimeout(forceExitTimeout);
                process.exit(1);
            }
        });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};
startServer().catch(err => {
    logger_1.logger.error('Fatal server startup error:', err);
    process.exit(1);
});
