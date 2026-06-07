"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeNoSql = void 0;
const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }
        const clean = {};
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
const sanitizeNoSql = (req, res, next) => {
    if (req.body)
        req.body = sanitize(req.body);
    if (req.query)
        req.query = sanitize(req.query);
    if (req.params)
        req.params = sanitize(req.params);
    next();
};
exports.sanitizeNoSql = sanitizeNoSql;
