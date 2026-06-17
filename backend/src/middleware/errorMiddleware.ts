import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errors: any = undefined;

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.keys(err.errors).reduce((acc: any, key) => {
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
  logger.error(
    `[Express ErrorHandler] ${req.method} ${req.originalUrl} | Client IP: ${req.ip} | Status: ${statusCode}`,
    err,
    {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode
    }
  );

  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
