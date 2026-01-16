import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Email Template - Customizable notification templates
 */
const EmailTemplate = sequelize.define('EmailTemplate', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    type: {
        type: DataTypes.ENUM('approval_request', 'approved', 'rejected', 'expiring', 'reminder', 'custom'),
        allowNull: false,
    },
    subject: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    bodyHtml: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    bodyText: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    variables: {
        type: DataTypes.JSON, // List of available placeholders
        defaultValue: ['{{quoteNumber}}', '{{clientName}}', '{{totalAmount}}', '{{creatorName}}', '{{approverName}}'],
    },
}, {
    tableName: 'email_templates',
    timestamps: true,
});

/**
 * Webhook - External integrations (Slack, Teams, CRM)
 */
const Webhook = sequelize.define('Webhook', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('slack', 'teams', 'generic', 'crm'),
        defaultValue: 'generic',
    },
    events: {
        type: DataTypes.JSON, // ['quote.created', 'quote.submitted', 'quote.approved', 'quote.rejected']
        defaultValue: ['quote.approved'],
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    headers: {
        type: DataTypes.JSON, // Custom headers for authentication
        allowNull: true,
    },
    lastTriggered: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    failureCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    tableName: 'webhooks',
    timestamps: true,
});

export { EmailTemplate, Webhook };
