import { body, param } from 'express-validator';
import { Supplier, Category, FxRate, Setting, User, sequelize } from '../models/index.js';
import bcrypt from 'bcryptjs';
import fxRatesService from '../services/fxRates.js';
import { createAuditLog } from '../middleware/audit.js';
import { asyncHandler } from '../middleware/validate.js';
import crypto from 'crypto';
import emailService from '../services/email.js';

// ============================================
// Suppliers
// ============================================

export const supplierValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('defaultCurrency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
];

export const listSuppliers = asyncHandler(async (req, res) => {
    const suppliers = await Supplier.findAll({
        where: { isActive: true },
        order: [['name', 'ASC']],
    });

    res.json({
        success: true,
        data: suppliers,
    });
});

export const createSupplier = asyncHandler(async (req, res) => {
    const { name, defaultCurrency, contactEmail, notes } = req.body;

    const supplier = await Supplier.create({
        name,
        defaultCurrency,
        contactEmail,
        notes,
    });

    await createAuditLog(req.user.id, 'create', 'supplier', supplier.id, { name }, req);

    res.status(201).json({
        success: true,
        data: supplier,
    });
});

export const updateSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
        return res.status(404).json({
            success: false,
            message: 'Supplier not found',
        });
    }

    await supplier.update(req.body);
    await createAuditLog(req.user.id, 'update', 'supplier', supplier.id, {}, req);

    res.json({
        success: true,
        data: supplier,
    });
});

export const deleteSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
        return res.status(404).json({
            success: false,
            message: 'Supplier not found',
        });
    }

    await supplier.update({ isActive: false });
    await createAuditLog(req.user.id, 'delete', 'supplier', supplier.id, {}, req);

    res.json({
        success: true,
        message: 'Supplier deleted',
    });
});

// ============================================
// Categories
// ============================================

export const categoryValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('dutyRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Duty rate must be between 0 and 1'),
    body('handlingRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Handling rate must be between 0 and 1'),
    body('targetGmPercent').optional().isFloat({ min: 0, max: 1 }).withMessage('Target GM must be between 0 and 1'),
];

export const listCategories = asyncHandler(async (req, res) => {
    const categories = await Category.findAll({
        where: { isActive: true },
        order: [['name', 'ASC']],
    });

    res.json({
        success: true,
        data: categories,
    });
});

export const createCategory = asyncHandler(async (req, res) => {
    const { name, dutyRate, handlingRate, targetGmPercent, notes } = req.body;

    const category = await Category.create({
        name,
        dutyRate,
        handlingRate,
        targetGmPercent,
        notes,
    });

    await createAuditLog(req.user.id, 'create', 'category', category.id, { name }, req);

    res.status(201).json({
        success: true,
        data: category,
    });
});

export const updateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Category not found',
        });
    }

    await category.update(req.body);
    await createAuditLog(req.user.id, 'update', 'category', category.id, {}, req);

    res.json({
        success: true,
        data: category,
    });
});

// ============================================
// FX Rates
// ============================================

export const listFxRates = asyncHandler(async (req, res) => {
    const rates = await fxRatesService.getAllRates();

    res.json({
        success: true,
        data: rates,
    });
});

export const updateFxRate = asyncHandler(async (req, res) => {
    const { currency } = req.params;
    const { rateToBase } = req.body;

    await FxRate.upsert({
        currency,
        rateToBase,
        lastUpdated: new Date(),
        source: 'manual',
    });

    await createAuditLog(req.user.id, 'update', 'fx_rate', null, { currency, rateToBase }, req);

    const rate = await fxRatesService.getRate(currency);

    res.json({
        success: true,
        data: rate,
    });
});

export const refreshFxRates = asyncHandler(async (req, res) => {
    const result = await fxRatesService.refreshFxRates();

    if (!result.success) {
        return res.status(500).json({
            success: false,
            message: result.error,
        });
    }

    await createAuditLog(req.user.id, 'refresh', 'fx_rates', null, result, req);

    res.json({
        success: true,
        data: result,
    });
});

// ============================================
// Settings
// ============================================

export const getSettings = asyncHandler(async (req, res) => {
    const settings = await Setting.findAll();

    const settingsMap = {};
    settings.forEach(s => {
        settingsMap[s.key] = s.getTypedValue();
    });

    res.json({
        success: true,
        data: settingsMap,
    });
});

export const updateSettings = asyncHandler(async (req, res) => {
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
        await Setting.upsert({
            key,
            value: String(value),
            valueType: typeof value === 'number' ? 'number' :
                typeof value === 'boolean' ? 'boolean' : 'string',
        });
    }

    await createAuditLog(req.user.id, 'update', 'settings', null, updates, req);

    const settings = await Setting.findAll();
    const settingsMap = {};
    settings.forEach(s => {
        settingsMap[s.key] = s.getTypedValue();
    });

    res.json({
        success: true,
        data: settingsMap,
    });
});

// ============================================
// Users
// ============================================

export const listUsers = asyncHandler(async (req, res) => {
    // Safely remove purge from here as it likely fails due to FK constraints and blocks the UI
    // We will handle deletion strictly in the deleteUser endpoint or a background task

    const users = await User.findAll({
        attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires', 'invitationToken', 'invitationExpires'] },
        order: [['name', 'ASC']],
    });

    res.json({
        success: true,
        data: users,
    });
});

export const createUser = asyncHandler(async (req, res) => {
    const { email, name, role } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    try {
        // Simple case-insensitive lookup
        let user = await User.findOne({
            where: { email: normalizedEmail }
        });

        // Generate invitation token
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const invitationExpires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 48 hours

        if (user) {
            // Update existing user (could be inactive/deleted)
            await user.update({
                name,
                role,
                invitationToken,
                invitationExpires,
                isActive: false // Keep inactive until setup
            });
        } else {
            // Create new user
            user = await User.create({
                email: normalizedEmail,
                name,
                role,
                invitationToken,
                invitationExpires,
                isActive: false
            });
        }

        // Send invitation email
        const setupLink = `${req.protocol}://${req.get('host').replace(':5000', ':3000')}/setup-password/${invitationToken}`;
        await emailService.sendInvitationEmail(user, setupLink);

        await createAuditLog(req.user.id, 'invite', 'user', user.id, { email: normalizedEmail, name, role }, req);

        res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Create user error:', error.name, error.message);

        // Handle unique constraint violation (various formats)
        if (error.name === 'SequelizeUniqueConstraintError' ||
            error.message?.includes('UNIQUE constraint') ||
            error.message?.includes('Duplicate entry') ||
            error.message?.includes('duplicate key')) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate entry',
            });
        }

        // Return generic error with details
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create user',
        });
    }
});

export const setupPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
        where: {
            invitationToken: token,
            // invitationExpires: { [Op.gt]: new Date() } // Add Op import if needed, or simplified:
        }
    });

    if (!user || user.invitationExpires < new Date()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired invitation token',
        });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await user.update({
        passwordHash,
        invitationToken: null,
        invitationExpires: null,
        isActive: true
    });

    res.json({
        success: true,
        message: 'Password set successfully. You can now login.',
    });
});

export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (id === req.user.id) {
        return res.status(400).json({
            success: false,
            message: 'You cannot delete your own account',
        });
    }

    const user = await User.findByPk(id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    const { email } = user;
    await user.destroy();
    await createAuditLog(req.user.id, 'delete', 'user', id, { email }, req);

    res.json({
        success: true,
        message: 'User deleted permanently',
    });
});

export const purgeInactiveUsers = asyncHandler(async (req, res) => {
    // Find all inactive users first (outside transaction for better error messages)
    const inactiveUsers = await User.findAll({
        where: { isActive: false }
    });

    const count = inactiveUsers.length;

    if (count === 0) {
        return res.json({
            success: true,
            message: 'No inactive users to purge',
        });
    }

    const userIds = inactiveUsers.map(u => u.id);

    // Use a transaction to safely handle FK constraints
    const transaction = await sequelize.transaction();

    try {
        // 1. Delete Audit Logs for these users
        await sequelize.query(
            `DELETE FROM audit_logs WHERE user_id IN (${userIds.map(() => '?').join(',')})`,
            { replacements: userIds, transaction, type: sequelize.QueryTypes.DELETE }
        );

        // 2. Delete Quote Revisions created by these users (even on other people's quotes)
        await sequelize.query(
            `DELETE FROM quote_revisions WHERE user_id IN (${userIds.map(() => '?').join(',')})`,
            { replacements: userIds, transaction, type: sequelize.QueryTypes.DELETE }
        );

        // 3. Delete related quotes and their children
        for (const userId of userIds) {
            // Get all quote IDs for this user
            const userQuotes = await sequelize.query(
                `SELECT id FROM quotes WHERE creator_id = ? OR approver_id = ?`,
                { replacements: [userId, userId], transaction, type: sequelize.QueryTypes.SELECT }
            );

            const quoteIds = userQuotes.map(q => q.id);

            if (quoteIds.length > 0) {
                // Delete quote_lines for these quotes
                await sequelize.query(
                    `DELETE FROM quote_lines WHERE quote_id IN (${quoteIds.map(() => '?').join(',')})`,
                    { replacements: quoteIds, transaction, type: sequelize.QueryTypes.DELETE }
                );

                // Delete quote_revisions for these quotes
                await sequelize.query(
                    `DELETE FROM quote_revisions WHERE quote_id IN (${quoteIds.map(() => '?').join(',')})`,
                    { replacements: quoteIds, transaction, type: sequelize.QueryTypes.DELETE }
                );

                // Now delete the quotes themselves
                await sequelize.query(
                    `DELETE FROM quotes WHERE creator_id = ? OR approver_id = ?`,
                    { replacements: [userId, userId], transaction, type: sequelize.QueryTypes.DELETE }
                );
            }
        }

        // Now safely delete the users
        await User.destroy({ where: { isActive: false }, transaction });

        await transaction.commit();

        await createAuditLog(req.user.id, 'purge', 'user', null, { count }, req);

        res.json({
            success: true,
            message: `${count} inactive user(s) purged successfully. Associated quotes were also deleted.`,
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Purge error:', error);
        throw error;
    }
});

export default {
    // Suppliers
    listSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    supplierValidation,
    // Categories
    listCategories,
    createCategory,
    updateCategory,
    categoryValidation,
    // FX Rates
    listFxRates,
    updateFxRate,
    refreshFxRates,
    // Settings
    getSettings,
    updateSettings,
    // Users
    listUsers,
    createUser,
    deleteUser,
    purgeInactiveUsers,
    setupPassword,
};
