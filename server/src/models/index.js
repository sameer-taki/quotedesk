import sequelize from '../config/database.js';
import User from './User.js';
import Supplier from './Supplier.js';
import Category from './Category.js';
import FxRate from './FxRate.js';
import Setting from './Setting.js';
import Quote from './Quote.js';
import QuoteLine from './QuoteLine.js';
import QuoteRevision from './QuoteRevision.js';
import AuditLog from './AuditLog.js';
import Customer from './Customer.js';
import Product from './Product.js';
import ProductRelationship from './ProductRelationship.js';
import CompetitorProduct from './CompetitorProduct.js';

// ============================================
// Model Associations
// ============================================

// User -> Quote (creator)
User.hasMany(Quote, { foreignKey: 'creatorId', as: 'createdQuotes', onDelete: 'SET NULL' });
Quote.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

// User -> Quote (approver)
User.hasMany(Quote, { foreignKey: 'approverId', as: 'approvedQuotes', onDelete: 'SET NULL' });
Quote.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });

// Customer -> Quote
Customer.hasMany(Quote, { foreignKey: 'customerId', as: 'quotes' });
Quote.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Quote -> QuoteLine
Quote.hasMany(QuoteLine, { foreignKey: 'quoteId', as: 'lines', onDelete: 'CASCADE' });
QuoteLine.belongsTo(Quote, { foreignKey: 'quoteId', as: 'quote' });

// Quote -> QuoteRevision
Quote.hasMany(QuoteRevision, { foreignKey: 'quoteId', as: 'revisions', onDelete: 'CASCADE' });
QuoteRevision.belongsTo(Quote, { foreignKey: 'quoteId', as: 'quote' });

// User -> QuoteRevision
User.hasMany(QuoteRevision, { foreignKey: 'userId', as: 'revisions', onDelete: 'CASCADE' });
QuoteRevision.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Supplier -> QuoteLine
Supplier.hasMany(QuoteLine, { foreignKey: 'supplierId', as: 'quoteLines' });
QuoteLine.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// Category -> QuoteLine
Category.hasMany(QuoteLine, { foreignKey: 'categoryId', as: 'quoteLines' });
QuoteLine.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// User -> AuditLog
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs', onDelete: 'CASCADE' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Product -> Category
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Product -> Supplier
Supplier.hasMany(Product, { foreignKey: 'supplierId', as: 'products' });
Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// Product Relationships (Bundling)
Product.hasMany(ProductRelationship, { foreignKey: 'parentProductId', as: 'suggestedProducts' });
ProductRelationship.belongsTo(Product, { foreignKey: 'parentProductId', as: 'parentProduct' });
ProductRelationship.belongsTo(Product, { foreignKey: 'childProductId', as: 'childProduct' });

// ============================================
// Sync function (for development)
// ============================================
export const syncDatabase = async (force = false) => {
    try {
        // Just sync without alter to avoid FK constraint issues during table recreation
        await sequelize.sync({ force });
        console.log('✓ Database synchronized successfully');
        return true;
    } catch (error) {
        console.error('✗ Database sync failed:', error);
        if (error.errors) {
            error.errors.forEach(e => console.error(`  - ${e.message} (${e.type})`));
        }
        return false;
    }
};

// Export all models
export {
    sequelize,
    User,
    Supplier,
    Category,
    FxRate,
    Setting,
    Quote,
    QuoteLine,
    QuoteRevision,
    AuditLog,
    Customer,
    Product,
    ProductRelationship,
    CompetitorProduct,
};

export default {
    sequelize,
    User,
    Supplier,
    Category,
    FxRate,
    Setting,
    Quote,
    QuoteLine,
    QuoteRevision,
    AuditLog,
    Customer,
    Product,
    ProductRelationship,
    CompetitorProduct,
};

