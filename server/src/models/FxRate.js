import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FxRate = sequelize.define('FxRate', {
    currency: {
        type: DataTypes.STRING(3),
        primaryKey: true,
        allowNull: false,
        comment: 'ISO 4217 currency code, e.g., NZD, USD, AUD',
    },
    rateToBase: {
        type: DataTypes.DECIMAL(12, 6),
        allowNull: false,
        field: 'rate_to_base',
        comment: 'Exchange rate to convert 1 unit of this currency to base currency (FJD)',
    },
    lastUpdated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'last_updated',
    },
    source: {
        type: DataTypes.STRING(50),
        defaultValue: 'manual',
        comment: 'Source of rate: manual, frankfurter, etc.',
    },
}, {
    tableName: 'fx_rates',
    timestamps: false,
});

// Helper method to check if rate is stale
FxRate.prototype.isStale = function (staleHours = 240) {
    const now = new Date();
    const lastUpdate = new Date(this.lastUpdated);
    const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);
    return hoursDiff > staleHours;
};

export default FxRate;
