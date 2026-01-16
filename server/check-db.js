import { Sequelize, DataTypes } from 'sequelize';
import config from './src/config/env.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'data/quoteforge.sqlite'); // server/data/quoteforge.sqlite based on config

// Setup Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
});

const checkAndFix = async () => {
    try {
        console.log('Checking database schema...');
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('products');

        if (!tableInfo.stock_status) {
            console.log('Adding missing column: stock_status to products table...');
            await queryInterface.addColumn('products', 'stock_status', {
                type: DataTypes.ENUM('In Stock', 'Standard', 'Custom', 'Special Order'),
                defaultValue: 'Standard',
                allowNull: false
            });
            console.log('✓ Column added successfully.');
        } else {
            console.log('✓ stock_status column already exists.');
        }

        const quoteTableInfo = await queryInterface.describeTable('quotes');
        if (!quoteTableInfo.is_template) {
            console.log('Adding missing column: is_template to quotes table...');
            await queryInterface.addColumn('quotes', 'is_template', {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            });
            console.log('✓ Column added successfully.');
        } else {
            console.log('✓ is_template column already exists.');
        }

        if (!quoteTableInfo.win_probability) {
            console.log('Adding missing column: win_probability to quotes table...');
            await queryInterface.addColumn('quotes', 'win_probability', {
                type: DataTypes.INTEGER,
                allowNull: true
            });
            console.log('✓ Column added successfully.');
        } else {
            console.log('✓ win_probability column already exists.');
        }

        if (!quoteTableInfo.ai_analysis) {
            console.log('Adding missing column: ai_analysis to quotes table...');
            await queryInterface.addColumn('quotes', 'ai_analysis', {
                type: DataTypes.TEXT,
                allowNull: true
            });
            console.log('✓ Column added successfully.');
        } else {
            console.log('✓ ai_analysis column already exists.');
        }

        // Check for new tables
        const tables = await queryInterface.showAllTables();
        console.log('Existing tables:', tables);

    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        await sequelize.close();
    }
};

checkAndFix();
