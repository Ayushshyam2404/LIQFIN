import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

// Ensure log directory exists
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create log directory:', err);
}

const formatMessage = (level: string, message: string, meta?: any): string => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

const writeToFile = (filename: string, content: string) => {
  try {
    fs.appendFileSync(path.join(logDir, filename), content + '\n');
  } catch (err) {
    // Fallback to console if file writing fails
    console.error(`Failed to write to log file ${filename}:`, err);
  }
};

export const logger = {
  info: (message: string, meta?: any) => {
    const formatted = formatMessage('INFO', message, meta);
    console.log(formatted);
    writeToFile('combined.log', formatted);
  },
  warn: (message: string, meta?: any) => {
    const formatted = formatMessage('WARN', message, meta);
    console.warn(formatted);
    writeToFile('combined.log', formatted);
  },
  error: (message: string, error?: any, meta?: any) => {
    let errDetail = '';
    if (error instanceof Error) {
      errDetail = ` | Error: ${error.message}\nStack: ${error.stack}`;
    } else if (error) {
      errDetail = ` | Error: ${JSON.stringify(error)}`;
    }
    const formatted = formatMessage('ERROR', `${message}${errDetail}`, meta);
    console.error(formatted);
    writeToFile('combined.log', formatted);
    writeToFile('error.log', formatted);
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      const formatted = formatMessage('DEBUG', message, meta);
      console.log(formatted);
    }
  }
};
