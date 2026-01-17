import bcrypt from 'bcryptjs';
import { User, Supplier, Category, FxRate, Setting } from './models/index.js';

/**
 * Seed production data for QuoteForge
 */
export const seedProductionDatabase = async () => {
    console.log('🌱 Seeding production database...');

    try {
        // ============================================
        // Production Admin User
        // ============================================
        const adminPassword = await bcrypt.hash('5ponge@B0b', 12);

        await User.bulkCreate([
            {
                email: 'sameer.mohammed@kastel.com.au',
                passwordHash: adminPassword,
                name: 'Sameer Mohammed',
                role: 'admin',
            },
        ], { ignoreDuplicates: true });

        console.log('  ✓ Admin user created');

        // ============================================
        // Suppliers (from Excel reference)
        // ============================================
        await Supplier.bulkCreate([
            { name: 'Westcon Comstor', defaultCurrency: 'NZD', notes: '32 Canaveral Drive' },
            { name: 'Ingram Micro', defaultCurrency: 'NZD' },
            { name: 'Dicker Data', defaultCurrency: 'AUD' },
            { name: 'Tech Data', defaultCurrency: 'USD' },
            { name: 'Arrow Electronics', defaultCurrency: 'USD' },
            { name: 'Synnex', defaultCurrency: 'AUD' },
            { name: 'Exclusive Networks', defaultCurrency: 'NZD' },
        ], { ignoreDuplicates: true });

        console.log('  ✓ Suppliers seeded');

        // ============================================
        // Categories (with duty rates and margins)
        // ============================================
        await Category.bulkCreate([
            { name: 'Networking', dutyRate: 0.05, handlingRate: 0.02, targetGmPercent: 0.25, notes: 'Switches, routers, firewalls' },
            { name: 'Security', dutyRate: 0.05, handlingRate: 0.02, targetGmPercent: 0.25, notes: 'Firewalls, security software' },
            { name: 'Server', dutyRate: 0.05, handlingRate: 0.03, targetGmPercent: 0.20, notes: 'Physical and virtual servers' },
            { name: 'Storage', dutyRate: 0.05, handlingRate: 0.03, targetGmPercent: 0.20, notes: 'SAN, NAS, backup' },
            { name: 'Software', dutyRate: 0.00, handlingRate: 0.00, targetGmPercent: 0.15, notes: 'Licenses and subscriptions' },
            { name: 'Services', dutyRate: 0.00, handlingRate: 0.00, targetGmPercent: 0.35, notes: 'Installation, support' },
            { name: 'Accessories', dutyRate: 0.10, handlingRate: 0.05, targetGmPercent: 0.30, notes: 'Cables, adapters, peripherals' },
            { name: 'Cloud', dutyRate: 0.00, handlingRate: 0.00, targetGmPercent: 0.15, notes: 'Cloud services subscriptions' },
        ], { ignoreDuplicates: true });

        console.log('  ✓ Categories seeded');

        // ============================================
        // FX Rates (initial rates to FJD)
        // ============================================
        await FxRate.bulkCreate([
            { currency: 'NZD', rateToBase: 1.39, lastUpdated: new Date(), source: 'manual' },
            { currency: 'AUD', rateToBase: 1.48, lastUpdated: new Date(), source: 'manual' },
            { currency: 'USD', rateToBase: 2.22, lastUpdated: new Date(), source: 'manual' },
            { currency: 'EUR', rateToBase: 2.40, lastUpdated: new Date(), source: 'manual' },
            { currency: 'GBP', rateToBase: 2.80, lastUpdated: new Date(), source: 'manual' },
            { currency: 'SGD', rateToBase: 1.65, lastUpdated: new Date(), source: 'manual' },
        ], { ignoreDuplicates: true });

        console.log('  ✓ FX Rates seeded');

        // ============================================
        // Settings
        // ============================================
        await Setting.bulkCreate([
            { key: 'base_currency', value: 'FJD', description: 'Base currency for all quotes', valueType: 'string' },
            { key: 'vat_rate', value: '0.125', description: 'VAT/GST rate (12.5%)', valueType: 'number' },
            { key: 'quote_validity_days', value: '14', description: 'Default quote validity in days', valueType: 'number' },
            { key: 'low_gm_threshold', value: '0.08', description: 'Low margin threshold (8%)', valueType: 'number' },
            { key: 'critical_gm_threshold', value: '0.05', description: 'Critical margin threshold (5%)', valueType: 'number' },
            { key: 'fx_stale_hours', value: '240', description: 'Hours before FX rate is considered stale', valueType: 'number' },
            { key: 'company_name', value: 'Kastel Technologies', description: 'Company name for documents', valueType: 'string' },
            { key: 'default_footer_notes', value: 'Prices valid for 14 days. Payment: 50% deposit. Delivery time confirmed upon order.', description: 'Default footer notes for quotes', valueType: 'string' },
        ], { ignoreDuplicates: true });

        console.log('  ✓ Settings seeded');

        console.log('✅ Production database seeding complete!');
        console.log('\n📋 Admin account:');
        console.log('   Email:    sameer.mohammed@kastel.com.au');
        console.log('   Password: (set by you)\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
};

// Run if called directly
if (process.argv[1].includes('seed-prod.js')) {
    import('./config/database.js').then(async ({ testConnection }) => {
        await testConnection();
        import('./models/index.js').then(async ({ syncDatabase }) => {
            await syncDatabase(false);
            await seedProductionDatabase();
            process.exit(0);
        });
    });
}

export default seedProductionDatabase;
