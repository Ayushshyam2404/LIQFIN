"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const sanitizeMiddleware_1 = require("./middleware/sanitizeMiddleware");
// Import Routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const expenseRoutes_1 = __importDefault(require("./routes/expenseRoutes"));
const cardRoutes_1 = __importDefault(require("./routes/cardRoutes"));
const budgetRoutes_1 = __importDefault(require("./routes/budgetRoutes"));
const goalRoutes_1 = __importDefault(require("./routes/goalRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const healthController_1 = require("./controllers/healthController");
const app = (0, express_1.default)();
// Trust proxy headers for behind reverse proxies (like Heroku, AWS, Cloudflare, etc.)
app.enable('trust proxy');
// Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
            next();
        }
        else {
            res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
    });
}
// Security Headers with Helmet
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
// CORS Configuration
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://127.0.0.1:5173'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
// Rate Limiting to protect endpoints (Production only for general API)
if (process.env.NODE_ENV !== 'development') {
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // Limit each IP to 1000 requests per window
        message: { success: false, message: 'Too many requests, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false
    });
    app.use(limiter);
}
// Strict Auth Route Rate Limiting (always enabled)
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 auth attempts per window
    message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/auth', authLimiter);
// Body Parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Sanitizer for NoSQL Injection (removes keys starting with '$' or containing '.')
app.use(sanitizeMiddleware_1.sanitizeNoSql);
// Custom Cookie Parser middleware to avoid extra package dependencies
app.use((req, res, next) => {
    const cookieHeader = req.headers.cookie;
    req.cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach((cookie) => {
            const parts = cookie.split('=');
            const name = parts[0].trim();
            const value = parts.slice(1).join('=');
            req.cookies[name] = decodeURIComponent(value || '').trim();
        });
    }
    next();
});
// Serve static uploads with aggressive caching (1 day) to support browser & CDN caching
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../public/uploads'), {
    maxAge: '1d',
    immutable: true
}));
// Root Ping Route
app.get('/health', healthController_1.getHealth);
// Register Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/expenses', expenseRoutes_1.default);
app.use('/api/cards', cardRoutes_1.default);
app.use('/api/budgets', budgetRoutes_1.default);
app.use('/api/goals', goalRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
// Fallback 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});
// Global Error Handler
app.use(errorMiddleware_1.errorHandler);
exports.default = app;
