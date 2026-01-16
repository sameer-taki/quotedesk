import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CompetitorProduct = sequelize.define('CompetitorProduct', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    sku: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'SKU to match against our products',
    },
    competitorName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'competitor_name',
    },
    price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'NZD',
    },
    url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lastCheckedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'last_checked_at',
    },
}, {
    tableName: 'competitor_products',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['sku'],
        },
    ],
});

export default CompetitorProduct;
