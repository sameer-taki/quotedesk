import { Product, Category, Supplier } from '../models/index.js';
import { body } from 'express-validator';

// Validation rules
export const productValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('sku').optional().trim(),
    body('baseCost').isFloat({ min: 0 }).withMessage('Base cost must be positive'),
    body('categoryId').optional().isUUID(),
    body('supplierId').optional().isUUID(),
];

// Get all products
export const getProducts = async (req, res) => {
    try {
        const { search, categoryId, supplierId, active = 'true' } = req.query;

        const where = {};
        if (active === 'true') where.isActive = true;
        if (categoryId) where.categoryId = categoryId;
        if (supplierId) where.supplierId = supplierId;

        const products = await Product.findAll({
            where,
            include: [
                { model: Category, as: 'category', attributes: ['id', 'name', 'dutyRate', 'handlingRate', 'targetGmPercent'] },
                { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'defaultCurrency'] },
            ],
            order: [['name', 'ASC']],
        });

        // Filter by search term if provided
        let filtered = products;
        if (search) {
            const term = search.toLowerCase();
            filtered = products.filter(p =>
                p.name.toLowerCase().includes(term) ||
                (p.sku && p.sku.toLowerCase().includes(term)) ||
                (p.description && p.description.toLowerCase().includes(term))
            );
        }

        res.json({
            success: true,
            data: filtered,
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
        });
    }
};

// Get single product
export const getProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [
                { model: Category, as: 'category' },
                { model: Supplier, as: 'supplier' },
            ],
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        res.json({
            success: true,
            data: product,
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product',
        });
    }
};

// Create product
export const createProduct = async (req, res) => {
    try {
        const { sku, name, description, categoryId, supplierId, baseCost, basePrice, currency, freightRate } = req.body;

        const product = await Product.create({
            sku,
            name,
            description,
            categoryId: categoryId || null,
            supplierId: supplierId || null,
            baseCost,
            basePrice,
            currency: currency || 'NZD',
            freightRate: freightRate || 0.05,
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product,
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product',
        });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        const { sku, name, description, categoryId, supplierId, baseCost, basePrice, currency, freightRate, isActive } = req.body;

        await product.update({
            sku,
            name,
            description,
            categoryId: categoryId || null,
            supplierId: supplierId || null,
            baseCost,
            basePrice,
            currency,
            freightRate,
            isActive: isActive !== undefined ? isActive : product.isActive,
        });

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product,
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product',
        });
    }
};

// Delete product (soft delete)
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        await product.update({ isActive: false });

        res.json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
        });
    }
};
