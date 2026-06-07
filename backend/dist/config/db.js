"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
        console.log(`Connecting to MongoDB at: ${connString.replace(/:([^:@]+)@/, ':****@')}`);
        // Enterprise-grade Mongoose Connection Pooling and Resilience Options
        await mongoose_1.default.connect(connString, {
            maxPoolSize: 50, // Allow up to 50 concurrent connection sockets
            minPoolSize: 5, // Maintain at least 5 connection sockets active
            socketTimeoutMS: 45000, // Close idle sockets after 45 seconds
            serverSelectionTimeoutMS: 5000, // Fail fast if database is unreachable (5 seconds)
            heartbeatFrequencyMS: 10000 // Keep connections alive with a heartbeat every 10 seconds
        });
        console.log('MongoDB Connected successfully.');
    }
    catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
