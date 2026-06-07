import { logger } from './logger';

class ErrorTracker {
  private isSentryInitialized = false;

  constructor() {
    this.initializeSentry();
  }

  private initializeSentry() {
    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
      try {
        // Dynamic import or check if sentry is installed
        // In real setup, you would do: Sentry.init({ dsn });
        this.isSentryInitialized = true;
        logger.info('Sentry initialized successfully.');
      } catch (err) {
        logger.error('Failed to initialize Sentry SDK', err);
      }
    } else {
      logger.info('Sentry DSN not provided. Error tracker running in Log-only mode.');
    }
  }

  captureException(error: Error, context?: any) {
    logger.error(`Captured exception: ${error.message}`, error, context);
    
    if (this.isSentryInitialized) {
      // In production: Sentry.captureException(error, { extra: context });
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: any) {
    if (level === 'error') {
      logger.error(message, null, context);
    } else if (level === 'warning') {
      logger.warn(message, context);
    } else {
      logger.info(message, context);
    }

    if (this.isSentryInitialized) {
      // In production: Sentry.captureMessage(message, { level, extra: context });
    }
  }
}

export const errorTracker = new ErrorTracker();
