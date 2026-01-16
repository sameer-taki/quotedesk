import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { body } from 'express-validator';
import { User } from '../models/index.js';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import { createAuditLog } from '../middleware/audit.js';
import { asyncHandler } from '../middleware/validate.js';

/**
 * Validation rules for auth endpoints
 */
export const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

export const registerValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('role')
        .optional()
        .isIn(['admin', 'creator', 'approver', 'viewer'])
        .withMessage('Invalid role'),
];

export const forgotPasswordValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
];

export const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
];

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
        });
    }

    // Check if account is active
    if (!user.isActive) {
        return res.status(401).json({
            success: false,
            message: 'Account is deactivated',
        });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
        });
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Log the action
    await createAuditLog(user.id, 'login', 'user', user.id, {}, req);

    res.json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token,
            refreshToken,
        },
    });
});

/**
 * Register new user (admin only in production)
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
    const { email, password, name, role = 'viewer' } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: 'Email already registered',
        });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
        email,
        passwordHash,
        name,
        role,
    });

    // Log the action
    await createAuditLog(req.user?.id, 'create', 'user', user.id, { email, name, role }, req);

    res.status(201).json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'email', 'name', 'role', 'lastLoginAt', 'createdAt'],
    });

    res.json({
        success: true,
        data: user,
    });
});

/**
 * Forgot password - send reset email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
        return res.json({
            success: true,
            message: 'If the email exists, a reset link will be sent',
        });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token with expiry (1 hour)
    await user.update({
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    // TODO: Send email with reset link
    // For now, log the token (development only)
    console.log('Password reset token:', resetToken);

    res.json({
        success: true,
        message: 'If the email exists, a reset link will be sent',
        // Only in development
        ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
});

/**
 * Reset password
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
        where: {
            passwordResetToken: hashedToken,
        },
    });

    if (!user || new Date(user.passwordResetExpires) < new Date()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired reset token',
        });
    }

    // Update password
    const passwordHash = await bcrypt.hash(password, 12);
    await user.update({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
    });

    // Log the action
    await createAuditLog(user.id, 'password_reset', 'user', user.id, {}, req);

    res.json({
        success: true,
        message: 'Password reset successful',
    });
});

/**
 * Refresh token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken: token } = req.body;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'Refresh token is required',
        });
    }

    try {
        const jwt = await import('jsonwebtoken');
        const config = (await import('../config/env.js')).default;

        const decoded = jwt.default.verify(token, config.jwt.secret);
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
            });
        }

        const newToken = generateToken(user);

        res.json({
            success: true,
            data: { token: newToken },
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid refresh token',
        });
    }
});

export default {
    login,
    register,
    getMe,
    forgotPassword,
    resetPassword,
    refreshToken,
    loginValidation,
    registerValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
};
