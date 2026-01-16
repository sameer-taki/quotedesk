import { AuditLog } from '../models/index.js';

/**
 * Audit logging middleware
 * Logs actions to audit_logs table
 */
export const createAuditLog = async (userId, action, entityType, entityId, details = {}, req = null) => {
    try {
        await AuditLog.create({
            userId,
            action,
            entityType,
            entityId,
            details,
            ipAddress: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.get('User-Agent'),
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging should not break the main flow
    }
};

/**
 * Audit middleware for specific actions
 */
export const auditMiddleware = (action, entityType) => {
    return (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to capture response
        res.json = (body) => {
            // Only log successful operations
            if (res.statusCode >= 200 && res.statusCode < 300 && body.success !== false) {
                const entityId = body.data?.id || req.params.id;
                createAuditLog(
                    req.user?.id,
                    action,
                    entityType,
                    entityId,
                    {
                        method: req.method,
                        path: req.path,
                        body: sanitizeBody(req.body),
                    },
                    req
                );
            }
            return originalJson(body);
        };

        next();
    };
};

/**
 * Remove sensitive fields from body for logging
 */
const sanitizeBody = (body) => {
    if (!body) return {};

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret'];

    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
};

export default {
    createAuditLog,
    auditMiddleware,
};
