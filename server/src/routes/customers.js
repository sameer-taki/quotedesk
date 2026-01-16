import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    customerValidation,
} from '../controllers/customerController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/customers - List all customers
router.get('/', getCustomers);

// GET /api/customers/:id - Get single customer
router.get('/:id', getCustomer);

// POST /api/customers - Create customer (admin, creator)
router.post('/',
    authorize('admin', 'creator'),
    customerValidation,
    validate,
    createCustomer
);

// PUT /api/customers/:id - Update customer (admin, creator)
router.put('/:id',
    authorize('admin', 'creator'),
    customerValidation,
    validate,
    updateCustomer
);

// DELETE /api/customers/:id - Delete customer (admin only)
router.delete('/:id',
    authorize('admin'),
    deleteCustomer
);

export default router;
