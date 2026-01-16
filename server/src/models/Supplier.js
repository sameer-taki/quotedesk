import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Supplier = sequelize.define('Supplier', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    defaultCurrency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'NZD',
        field: 'default_currency',
    },
    contactEmail: {
        type: DataTypes.STRING(255),
        field: 'contact_email',
    },
    notes: {
        type: DataTypes.TEXT,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
    },
}, {
    tableName: 'suppliers',
    timestamps: true,
    underscored: true,
});

export default Supplier;
