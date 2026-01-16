import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Discount Schedule - Defines volume or promotional discounts
 */
const DiscountSchedule = sequelize.define('DiscountSchedule', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    type: {
        type: DataTypes.ENUM('volume', 'promotional', 'customer', 'category'),
        defaultValue: 'volume',
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    endDate: {
        type: DataTypes.DATEONLY,
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
}, {
    tableName: 'discount_schedules',
    timestamps: true,
});

/**
 * Discount Tier - Volume breaks or promotional tiers
 */
const DiscountTier = sequelize.define('DiscountTier', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    scheduleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'discount_schedules',
            key: 'id',
        },
    },
    minQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    maxQuantity: {
        type: DataTypes.INTEGER,
        allowNull: true, // null = no upper limit
    },
    discountPercent: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0,
    },
    discountAmount: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: true, // Alternative to percent
    },
}, {
    tableName: 'discount_tiers',
    timestamps: true,
});

// Associations
DiscountSchedule.hasMany(DiscountTier, { foreignKey: 'scheduleId', as: 'tiers', onDelete: 'CASCADE' });
DiscountTier.belongsTo(DiscountSchedule, { foreignKey: 'scheduleId', as: 'schedule' });

export { DiscountSchedule, DiscountTier };
