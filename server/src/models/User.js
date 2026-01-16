import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'password_hash',
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('admin', 'creator', 'approver', 'viewer'),
        allowNull: false,
        defaultValue: 'viewer',
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
    },
    lastLoginAt: {
        type: DataTypes.DATE,
        field: 'last_login_at',
    },
    passwordResetToken: {
        type: DataTypes.STRING(255),
        field: 'password_reset_token',
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        field: 'password_reset_expires',
    },
    invitationToken: {
        type: DataTypes.STRING(255),
        field: 'invitation_token',
    },
    invitationExpires: {
        type: DataTypes.DATE,
        field: 'invitation_expires',
    },
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
});

export default User;
