import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Category = sequelize.define('Category', {
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
    dutyRate: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'duty_rate',
        comment: 'Duty percentage as decimal, e.g., 0.05 for 5%',
    },
    handlingRate: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'handling_rate',
        comment: 'Clearing & Handling percentage as decimal',
    },
    targetGmPercent: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0.25,
        field: 'target_gm_percent',
        comment: 'Target gross margin percentage, e.g., 0.25 for 25%',
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
    tableName: 'categories',
    timestamps: true,
    underscored: true,
});

export default Category;
