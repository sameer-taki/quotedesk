import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QuoteRevision = sequelize.define('QuoteRevision', {
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
    revisionNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'revision_number',
    },
    snapshot: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: 'Full snapshot of quote and lines at this revision',
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id',
        },
    },
    changeReason: {
        type: DataTypes.STRING(500),
        field: 'change_reason',
    },
}, {
    tableName: 'quote_revisions',
    timestamps: true,
    underscored: true,
    updatedAt: false, // Revisions are immutable
});

export default QuoteRevision;
