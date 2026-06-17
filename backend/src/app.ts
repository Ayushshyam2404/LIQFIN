import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { errorHandler } from './middleware/errorMiddleware';
import { sanitizeNoSql } from './middleware/sanitizeMiddleware';

// Import Routes
import authRoutes from './routes/authRoutes';
import expenseRoutes from './routes/expenseRoutes';
import cardRoutes from './routes/cardRoutes';
import budgetRoutes from './routes/budgetRoutes';
import goalRoutes from './routes/goalRoutes';
import notificationRoutes from './routes/notificationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import aiRoutes from './routes/aiRoutes';
import { getHealth } from './controllers/healthController';

const app = express();

// Trust proxy headers for behind reverse proxies (like Heroku, AWS, Cloudflare, etc.)
app.enable('trust proxy');

// Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      next();
    } else {
      res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  });
}

// Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate Limiting to protect endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Strict Auth Route Rate Limiting (always enabled)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 auth attempts per window
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth', authLimiter);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitizer for NoSQL Injection (removes keys starting with '$' or containing '.')
app.use(sanitizeNoSql);

// Custom Cookie Parser middleware to avoid extra package dependencies
app.use((req: any, res: Response, next: NextFunction) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie: string) => {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      const value = parts.slice(1).join('=');
      req.cookies[name] = decodeURIComponent(value || '').trim();
    });
  }
  next();
});

// Serve static uploads with aggressive caching (1 day) to support browser & CDN caching
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), {
  maxAge: '1d',
  immutable: true
}));

// Root Ping Route
app.get('/health', getHealth);

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// Fallback 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use(errorHandler);

export default app;
