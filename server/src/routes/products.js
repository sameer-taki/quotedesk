import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    productValidation,
} from '../controllers/productController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/products - List all products (with search)
router.get('/', getProducts);

// GET /api/products/:id - Get single product
router.get('/:id', getProduct);

// POST /api/products - Create product (admin only)
router.post('/',
    authorize('admin'),
    productValidation,
    validate,
    createProduct
);

// PUT /api/products/:id - Update product (admin only)
router.put('/:id',
    authorize('admin'),
    productValidation,
    validate,
    updateProduct
);

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id',
    authorize('admin'),
    deleteProduct
);

export default router;
