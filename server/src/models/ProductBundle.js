import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Product Bundle - Group of related products sold together
 */
const ProductBundle = sequelize.define('ProductBundle', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    discountPercent: {
        type: DataTypes.DECIMAL(5, 4),
        defaultValue: 0, // Bundle discount when all items included
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'product_bundles',
    timestamps: true,
});

/**
 * Product Bundle Item - Products within a bundle
 */
const ProductBundleItem = sequelize.define('ProductBundleItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    bundleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'product_bundles',
            key: 'id',
        },
    },
    productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id',
        },
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
    isRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Required vs optional in bundle
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    tableName: 'product_bundle_items',
    timestamps: true,
});

/**
 * Favorite Configuration - Saved line item templates
 */
const FavoriteConfig = sequelize.define('FavoriteConfig', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    lineItemData: {
        type: DataTypes.JSON, // Store complete line item configuration
        allowNull: false,
    },
    isShared: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // If true, visible to all users
    },
}, {
    tableName: 'favorite_configs',
    timestamps: true,
});

// Associations
ProductBundle.hasMany(ProductBundleItem, { foreignKey: 'bundleId', as: 'items', onDelete: 'CASCADE' });
ProductBundleItem.belongsTo(ProductBundle, { foreignKey: 'bundleId', as: 'bundle' });

export { ProductBundle, ProductBundleItem, FavoriteConfig };
