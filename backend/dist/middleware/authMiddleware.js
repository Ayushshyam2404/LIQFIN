"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const protect = async (req, res, next) => {
    let token;
    // Check auth header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Fallback to cookie if cookies are used
    else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, token missing' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email
        };
        next();
    }
    catch (error) {
        console.error('JWT Token Verification Error:', error);
        res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
};
exports.protect = protect;
