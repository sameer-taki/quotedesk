import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Setting = sequelize.define('Setting', {
    key: {
        type: DataTypes.STRING(100),
        primaryKey: true,
        allowNull: false,
    },
    value: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    valueType: {
        type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
        defaultValue: 'string',
        field: 'value_type',
    },
}, {
    tableName: 'settings',
    timestamps: true,
    underscored: true,
});

// Helper to get typed value
Setting.prototype.getTypedValue = function () {
    switch (this.valueType) {
        case 'number':
            return parseFloat(this.value);
        case 'boolean':
            return this.value === 'true';
        case 'json':
            return JSON.parse(this.value);
        default:
            return this.value;
    }
};

// Static helper to get a setting value
Setting.getValue = async function (key, defaultValue = null) {
    const setting = await this.findByPk(key);
    return setting ? setting.getTypedValue() : defaultValue;
};

export default Setting;
