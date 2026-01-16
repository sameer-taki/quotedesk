import { Customer } from '../models/index.js';
import { body } from 'express-validator';

// Validation rules
export const customerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('company').trim().notEmpty().withMessage('Company name is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('notes').optional().trim(),
];

// Get all customers
export const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.findAll({
            where: { isActive: true },
            order: [['name', 'ASC']],
        });

        res.json({
            success: true,
            data: customers,
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customers',
        });
    }
};

// Get single customer
export const getCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        res.json({
            success: true,
            data: customer,
        });
    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer',
        });
    }
};

// Create customer
export const createCustomer = async (req, res) => {
    try {
        const { name, email, phone, company, address, notes } = req.body;

        const customer = await Customer.create({
            name,
            email,
            phone,
            company,
            address,
            notes,
        });

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: customer,
        });
    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create customer',
        });
    }
};

// Update customer
export const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        const { name, email, phone, company, address, notes } = req.body;

        await customer.update({
            name,
            email,
            phone,
            company,
            address,
            notes,
        });

        res.json({
            success: true,
            message: 'Customer updated successfully',
            data: customer,
        });
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update customer',
        });
    }
};

// Delete customer (soft delete)
export const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        await customer.update({ isActive: false });

        res.json({
            success: true,
            message: 'Customer deleted successfully',
        });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete customer',
        });
    }
};
