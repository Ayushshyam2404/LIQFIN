"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const emailSyncService_1 = require("../utils/emailSyncService");
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const run = async () => {
    const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
    await mongoose_1.default.connect(connString);
    console.log('Database connected. Triggering sync...');
    try {
        await (0, emailSyncService_1.syncAllUsers)();
    }
    catch (err) {
        console.error('Error during sync:', err);
    }
    await mongoose_1.default.disconnect();
    console.log('Sync script completed.');
};
run();
