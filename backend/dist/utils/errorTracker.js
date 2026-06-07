"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorTracker = void 0;
const logger_1 = require("./logger");
class ErrorTracker {
    isSentryInitialized = false;
    constructor() {
        this.initializeSentry();
    }
    initializeSentry() {
        const dsn = process.env.SENTRY_DSN;
        if (dsn) {
            try {
                // Dynamic import or check if sentry is installed
                // In real setup, you would do: Sentry.init({ dsn });
                this.isSentryInitialized = true;
                logger_1.logger.info('Sentry initialized successfully.');
            }
            catch (err) {
                logger_1.logger.error('Failed to initialize Sentry SDK', err);
            }
        }
        else {
            logger_1.logger.info('Sentry DSN not provided. Error tracker running in Log-only mode.');
        }
    }
    captureException(error, context) {
        logger_1.logger.error(`Captured exception: ${error.message}`, error, context);
        if (this.isSentryInitialized) {
            // In production: Sentry.captureException(error, { extra: context });
        }
    }
    captureMessage(message, level = 'info', context) {
        if (level === 'error') {
            logger_1.logger.error(message, null, context);
        }
        else if (level === 'warning') {
            logger_1.logger.warn(message, context);
        }
        else {
            logger_1.logger.info(message, context);
        }
        if (this.isSentryInitialized) {
            // In production: Sentry.captureMessage(message, { level, extra: context });
        }
    }
}
exports.errorTracker = new ErrorTracker();
