"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'Internal Server Error';
    let errors = undefined;
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        errors = Object.keys(err.errors).reduce((acc, key) => {
            acc[key] = err.errors[key].message;
            return acc;
        }, {});
    }
    // Handle mongoose bad ObjectId (CastError)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid format for field: ${err.path}`;
    }
    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
        statusCode = 409;
        const key = Object.keys(err.keyValue || {})[0] || 'field';
        message = `Duplicate value error: A record with this ${key} already exists.`;
    }
    // Handle JWT token errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token. Please log in again.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired. Please refresh your session.';
    }
    // Log the error with request details using the persistent logger
    logger_1.logger.error(`[Express ErrorHandler] ${req.method} ${req.originalUrl} | Client IP: ${req.ip} | Status: ${statusCode}`, err, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        statusCode
    });
    res.status(statusCode).json({
        success: false,
        message,
        errors,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
};
exports.errorHandler = errorHandler;
