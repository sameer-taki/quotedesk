import express from 'express';
import adminController from '../controllers/adminController.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Suppliers (read for all, write for admin)
// ============================================
router.get('/suppliers', adminController.listSuppliers);

router.post('/suppliers',
    authorize('admin'),
    adminController.supplierValidation,
    validate,
    adminController.createSupplier
);

router.put('/suppliers/:id',
    authorize('admin'),
    adminController.updateSupplier
);

router.delete('/suppliers/:id',
    authorize('admin'),
    adminController.deleteSupplier
);

// ============================================
// Categories (read for all, write for admin)
// ============================================
router.get('/categories', adminController.listCategories);

router.post('/categories',
    authorize('admin'),
    adminController.categoryValidation,
    validate,
    adminController.createCategory
);

router.put('/categories/:id',
    authorize('admin'),
    adminController.updateCategory
);

// ============================================
// FX Rates (read for all, write for admin)
// ============================================
router.get('/fx-rates', adminController.listFxRates);

router.put('/fx-rates/:currency',
    authorize('admin'),
    adminController.updateFxRate
);

router.post('/fx-rates/refresh',
    authorize('admin'),
    adminController.refreshFxRates
);

router.delete('/fx-rates/:currency',
    authorize('admin'),
    adminController.deleteFxRate
);

// ============================================
// Settings (read for all, write for admin)
// ============================================
router.get('/settings', adminController.getSettings);

router.put('/settings',
    authorize('admin'),
    adminController.updateSettings
);

// ============================================
// Users (admin only)
// ============================================
router.get('/users',
    authorize('admin'),
    adminController.listUsers
);

router.post('/users',
    authorize('admin'),
    adminController.createUser
);

router.delete('/users/:id', authorize('admin'), adminController.deleteUser);
router.post('/users/purge-inactive', authorize('admin'), adminController.purgeInactiveUsers);
router.post('/setup-password/:token', adminController.setupPassword);

export default router;
