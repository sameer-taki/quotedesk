import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Quote = sequelize.define('Quote', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    quoteNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'quote_number',
    },
    clientName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'client_name',
    },
    quoteDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'quote_date',
    },
    validUntil: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'valid_until',
    },
    status: {
        type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'accepted'),
        allowNull: false,
        defaultValue: 'draft',
    },
    creatorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'creator_id',
        references: {
            model: 'users',
            key: 'id',
        },
    },
    customerId: {
        type: DataTypes.UUID,
        field: 'customer_id',
        references: {
            model: 'customers',
            key: 'id',
        },
    },
    approverId: {
        type: DataTypes.UUID,
        field: 'approver_id',
        references: {
            model: 'users',
            key: 'id',
        },
    },
    approverComments: {
        type: DataTypes.TEXT,
        field: 'approver_comments',
    },
    notes: {
        type: DataTypes.TEXT,
    },
    footerNotes: {
        type: DataTypes.TEXT,
        field: 'footer_notes',
    },
    // Summary calculations (stored for quick access)
    totalLandedCost: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'total_landed_cost',
    },
    totalSellingExVat: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'total_selling_ex_vat',
    },
    totalVat: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'total_vat',
    },
    totalSellingIncVat: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'total_selling_inc_vat',
    },
    overallGmPercent: {
        type: DataTypes.DECIMAL(5, 4),
        defaultValue: 0,
        field: 'overall_gm_percent',
        comment: 'Overall gross margin = (Total Selling Ex VAT - Total Landed) / Total Selling Ex VAT',
    },
    // Portal & Acceptance
    publicId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
        field: 'public_id',
    },
    viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'view_count',
    },
    acceptedAt: {
        type: DataTypes.DATE,
        field: 'accepted_at',
    },
    acceptedBy: {
        type: DataTypes.STRING(255),
        field: 'accepted_by',
    },
    // Revision tracking
    revisionNumber: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'revision_number',
    },
    parentQuoteId: {
        type: DataTypes.UUID,
        field: 'parent_quote_id',
        references: {
            model: 'quotes',
            key: 'id',
        },
    },
    // AI Intelligence
    winProbability: {
        type: DataTypes.INTEGER, // 0-100
        allowNull: true,
        field: 'win_probability',
        validate: { min: 0, max: 100 }
    },
    aiAnalysis: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'ai_analysis',
    },
    isTemplate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_template',
    },
}, {
    tableName: 'quotes',
    timestamps: true,
    underscored: true,
});

export default Quote;
