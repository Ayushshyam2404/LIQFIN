import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
    logger.info(`Connecting to MongoDB at: ${connString.replace(/:([^:@]+)@/, ':****@')}`);
    
    // Enterprise-grade Mongoose Connection Pooling and Resilience Options
    await mongoose.connect(connString, {
      maxPoolSize: 50,                   // Allow up to 50 concurrent connection sockets
      minPoolSize: 5,                    // Maintain at least 5 connection sockets active
      socketTimeoutMS: 45000,            // Close idle sockets after 45 seconds
      serverSelectionTimeoutMS: 5000,   // Fail fast if database is unreachable (5 seconds)
      heartbeatFrequencyMS: 10000        // Keep connections alive with a heartbeat every 10 seconds
    });
    logger.info('MongoDB Connected successfully.');
  } catch (error: any) {
    logger.error(`MongoDB Connection Error: ${error.message}`, error);
    process.exit(1);
  }
};
