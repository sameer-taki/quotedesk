import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * QuoteLine Model
 * 
 * Calculation formulas (from Excel "Costing sheet.xlsx"):
 * 
 * Landed Cost = BuyPrice × (1 + FreightRate) × (1/ExchangeRate) × (1 + DutyRate) × (1 + HandlingRate)
 * Markup Amount = LandedCost × MarkupPercent
 * Unit Sell Ex VAT = LandedCost + MarkupAmount
 * Line Total Ex VAT = UnitSellExVat × Quantity
 * VAT Amount = LineTotalExVat × VATRate
 * Line Total Inc VAT = LineTotalExVat + VATAmount
 */
const QuoteLine = sequelize.define('QuoteLine', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    quoteId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'quote_id',
        references: {
            model: 'quotes',
            key: 'id',
        },
    },
    lineNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'line_number',
    },
    // Product/Service info
    partNumber: {
        type: DataTypes.STRING(100),
        field: 'part_number',
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    // Supplier & Category references
    supplierId: {
        type: DataTypes.UUID,
        field: 'supplier_id',
        references: {
            model: 'suppliers',
            key: 'id',
        },
    },
    categoryId: {
        type: DataTypes.UUID,
        field: 'category_id',
        references: {
            model: 'categories',
            key: 'id',
        },
    },
    // Quantity
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1,
        },
    },
    // Buy Price (in supplier currency)
    buyPrice: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        field: 'buy_price',
        comment: 'Unit cost in supplier currency',
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'NZD',
    },
    // Rates for calculations (can override category defaults)
    freightRate: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'freight_rate',
        comment: 'Freight percentage as decimal, e.g., 0.05 for 5%',
    },
    exchangeRate: {
        type: DataTypes.DECIMAL(12, 6),
        allowNull: false,
        field: 'exchange_rate',
        comment: 'Exchange rate to base currency (FJD). Rate = 1/FX so multiply converts to base.',
    },
    dutyRate: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'duty_rate',
        comment: 'Duty percentage as decimal',
    },
    handlingRate: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'handling_rate',
        comment: 'Clearing & Handling percentage as decimal',
    },
    // Markup (can override category default)
    targetMarkupPercent: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0.25,
        field: 'target_markup_percent',
        comment: 'Target markup percentage from category',
    },
    overrideMarkupPercent: {
        type: DataTypes.DECIMAL(5, 4),
        field: 'override_markup_percent',
        comment: 'Override markup percentage if different from target',
    },
    // Calculated fields (stored for quick access and audit)
    freightAmount: {
        type: DataTypes.DECIMAL(15, 4),
        field: 'freight_amount',
        comment: 'BuyPrice × FreightRate',
    },
    dutyAmount: {
        type: DataTypes.DECIMAL(15, 4),
        field: 'duty_amount',
        comment: 'Intermediate duty calculation',
    },
    handlingAmount: {
        type: DataTypes.DECIMAL(15, 4),
        field: 'handling_amount',
        comment: 'Intermediate handling calculation',
    },
    landedCost: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        field: 'landed_cost',
        comment: 'Total cost after all factors applied',
    },
    markupPercent: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        field: 'markup_percent',
        comment: 'Actual markup used (override or target)',
    },
    markupAmount: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        field: 'markup_amount',
        comment: 'LandedCost × MarkupPercent',
    },
    unitSellExVat: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        field: 'unit_sell_ex_vat',
        comment: 'LandedCost + MarkupAmount',
    },
    lineTotalExVat: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        field: 'line_total_ex_vat',
        comment: 'UnitSellExVat × Quantity',
    },
    vatAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        field: 'vat_amount',
        comment: 'LineTotalExVat × VATRate',
    },
    lineTotalIncVat: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        field: 'line_total_inc_vat',
        comment: 'LineTotalExVat + VATAmount',
    },
}, {
    tableName: 'quote_lines',
    timestamps: true,
    underscored: true,
});

export default QuoteLine;
