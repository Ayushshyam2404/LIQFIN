"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logDir = path_1.default.join(process.cwd(), 'logs');
// Ensure log directory exists
try {
    if (!fs_1.default.existsSync(logDir)) {
        fs_1.default.mkdirSync(logDir, { recursive: true });
    }
}
catch (err) {
    console.error('Failed to create log directory:', err);
}
const formatMessage = (level, message, meta) => {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
};
const writeToFile = (filename, content) => {
    try {
        fs_1.default.appendFileSync(path_1.default.join(logDir, filename), content + '\n');
    }
    catch (err) {
        // Fallback to console if file writing fails
        console.error(`Failed to write to log file ${filename}:`, err);
    }
};
exports.logger = {
    info: (message, meta) => {
        const formatted = formatMessage('INFO', message, meta);
        console.log(formatted);
        writeToFile('combined.log', formatted);
    },
    warn: (message, meta) => {
        const formatted = formatMessage('WARN', message, meta);
        console.warn(formatted);
        writeToFile('combined.log', formatted);
    },
    error: (message, error, meta) => {
        let errDetail = '';
        if (error instanceof Error) {
            errDetail = ` | Error: ${error.message}\nStack: ${error.stack}`;
        }
        else if (error) {
            errDetail = ` | Error: ${JSON.stringify(error)}`;
        }
        const formatted = formatMessage('ERROR', `${message}${errDetail}`, meta);
        console.error(formatted);
        writeToFile('combined.log', formatted);
        writeToFile('error.log', formatted);
    },
    debug: (message, meta) => {
        if (process.env.NODE_ENV !== 'production') {
            const formatted = formatMessage('DEBUG', message, meta);
            console.log(formatted);
        }
    }
};
