import { Request, Response, NextFunction } from 'express';

const sanitize = (obj: any): any => {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    const clean: any = {};
    for (const key of Object.keys(obj)) {
      // Strip any keys starting with '$' or containing '.' to prevent NoSQL injection
      if (!key.startsWith('$') && !key.includes('.')) {
        clean[key] = sanitize(obj[key]);
      }
    }
    return clean;
  }
  return obj;
};

export const sanitizeNoSql = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};
