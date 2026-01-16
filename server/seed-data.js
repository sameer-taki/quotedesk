import { User, Supplier, Category, Product, Setting, FxRate, sequelize } from './src/models/index.js';
import bcrypt from 'bcryptjs';

const seed = async () => {
    try {
        console.log('Seeding data...');

        // 1. Create Admin User
        const passwordHash = await bcrypt.hash('password123', 12);
        const admin = await User.create({
            email: 'admin@quoteforge.com',
            passwordHash,
            name: 'Admin User',
            role: 'admin'
        });
        console.log('✓ Admin user created: admin@quoteforge.com / password123');

        // 2. Create Suppliers
        const supplier = await Supplier.create({
            name: 'Global Tech NZ',
            defaultCurrency: 'NZD',
            contactEmail: 'sales@globaltech.co.nz'
        });
        console.log('✓ Supplier created');

        // 3. Create Categories
        const category = await Category.create({
            name: 'Laptops',
            dutyRate: 0.05,
            handlingRate: 0.02,
            targetGmPercent: 0.25
        });
        console.log('✓ Category created');

        // 4. Create Product
        await Product.create({
            sku: 'MBP14-2024',
            name: 'MacBook Pro 14 (M3 Pro)',
            categoryId: category.id,
            supplierId: supplier.id,
            baseCost: 3200,
            currency: 'NZD'
        });
        console.log('✓ Product created');

        // 5. Create Settings
        await Setting.bulkCreate([
            { key: 'vat_rate', value: '0.125', description: 'VAT Rate' },
            { key: 'quote_validity_days', value: '14', description: 'Days quote is valid' },
            { key: 'base_currency', value: 'FJD', description: 'Base currency' },
            { key: 'smart_approval_floor', value: '0.15', description: 'Smart Approval Margin Floor' }
        ]);
        console.log('✓ Settings created');

        // 6. Create FX Rate
        await FxRate.create({
            currency: 'NZD',
            rateToBase: 0.72,
            lastUpdated: new Date(),
            source: 'manual'
        });
        console.log('✓ FX Rate created');

        console.log('Done seeding!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
