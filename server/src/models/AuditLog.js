import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id',
        },
    },
    action: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Action type: create, update, delete, approve, reject, login, etc.',
    },
    entityType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'entity_type',
        comment: 'Type of entity: quote, user, supplier, etc.',
    },
    entityId: {
        type: DataTypes.UUID,
        field: 'entity_id',
    },
    details: {
        type: DataTypes.JSONB,
        comment: 'Additional details about the action',
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        field: 'ip_address',
    },
    userAgent: {
        type: DataTypes.STRING(500),
        field: 'user_agent',
    },
}, {
    tableName: 'audit_logs',
    timestamps: true,
    underscored: true,
    updatedAt: false, // Audit logs are immutable
});

export default AuditLog;
