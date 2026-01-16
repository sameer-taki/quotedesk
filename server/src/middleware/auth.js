import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { User } from '../models/index.js';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, config.jwt.secret);

            // Get user from database
            const user = await User.findByPk(decoded.userId, {
                attributes: ['id', 'email', 'name', 'role', 'isActive'],
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. User not found.',
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated.',
                });
            }

            // Attach user to request
            req.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            };

            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.',
                });
            }
            throw jwtError;
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error.',
        });
    }
};

/**
 * Role-based authorization middleware factory
 * @param {...string} allowedRoles - Roles that are allowed
 */
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated.',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.',
            });
        }

        next();
    };
};

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user.id },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
    );
};

export default {
    authenticate,
    authorize,
    generateToken,
    generateRefreshToken,
};
