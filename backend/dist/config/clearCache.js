"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const clearCache = async () => {
    const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
    console.log(`Connecting to: ${connString}`);
    await mongoose_1.default.connect(connString);
    try {
        const db = mongoose_1.default.connection.db;
        if (db) {
            await db.dropCollection('processedemails');
            console.log('Successfully dropped processedemails collection!');
        }
        else {
            console.error('Database connection not established.');
        }
    }
    catch (err) {
        console.log('Collection not found or already empty.');
    }
    await mongoose_1.default.disconnect();
};
clearCache();
