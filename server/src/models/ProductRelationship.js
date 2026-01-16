import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProductRelationship = sequelize.define('ProductRelationship', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    parentProductId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'parent_product_id',
        references: {
            model: 'products',
            key: 'id',
        },
    },
    childProductId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'child_product_id',
        references: {
            model: 'products',
            key: 'id',
        },
    },
    type: {
        type: DataTypes.ENUM('accessory', 'substitute', 'upsell'),
        defaultValue: 'accessory',
        allowNull: false,
    },
    confidenceScore: {
        type: DataTypes.DECIMAL(3, 2), // 0.00 to 1.00
        defaultValue: 1.0,
        field: 'confidence_score',
        comment: 'Strength of the recommendation',
    },
}, {
    tableName: 'product_relationships',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['parent_product_id', 'child_product_id'],
        },
    ],
});

export default ProductRelationship;
