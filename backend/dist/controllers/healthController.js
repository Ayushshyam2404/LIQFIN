"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const os_1 = __importDefault(require("os"));
const getHealth = async (req, res) => {
    const dbState = mongoose_1.default.connection.readyState;
    let dbStatus = 'disconnected';
    if (dbState === 1)
        dbStatus = 'connected';
    else if (dbState === 2)
        dbStatus = 'connecting';
    else if (dbState === 3)
        dbStatus = 'disconnecting';
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
            totalMemoryGB: (os_1.default.totalmem() / 1024 / 1024 / 1024).toFixed(2),
            freeMemoryGB: (os_1.default.freemem() / 1024 / 1024 / 1024).toFixed(2),
            cpuLoad: os_1.default.loadavg()
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
exports.getHealth = getHealth;
