import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    sku: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'categories',
            key: 'id',
        },
    },
    supplierId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'suppliers',
            key: 'id',
        },
    },
    baseCost: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
    },
    basePrice: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: true,
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'NZD',
    },
    freightRate: {
        type: DataTypes.DECIMAL(5, 4),
        defaultValue: 0.05,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    stockStatus: {
        type: DataTypes.ENUM('In Stock', 'Standard', 'Custom', 'Special Order'),
        defaultValue: 'Standard',
        allowNull: false,
        field: 'stock_status'
    },
}, {
    tableName: 'products',
    timestamps: true,
});

export default Product;
