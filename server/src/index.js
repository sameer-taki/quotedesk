import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/env.js';
import { testConnection } from './config/database.js';
import { syncDatabase } from './models/index.js';
import { errorHandler, notFoundHandler } from './middleware/validate.js';

// Import routes
import authRoutes from './routes/auth.js';
import quoteRoutes from './routes/quotes.js';
import adminRoutes from './routes/admin.js';
import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
}));

// Request logging
if (config.env !== 'test') {
    app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'QuoteForge API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', adminRoutes);

// ============================================
// Error Handling
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// Server Startup
// ============================================

const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Sync database (development only)
        if (config.env === 'development') {
            await syncDatabase(false); // Set to true to force recreate tables
        }

        // Start server
        app.listen(config.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                    QuoteForge API Server                   ║
╠════════════════════════════════════════════════════════════╣
║  Status:      Running                                      ║
║  Environment: ${config.env.padEnd(43)}║
║  Port:        ${String(config.port).padEnd(43)}║
║  API URL:     http://localhost:${config.port}/api${' '.repeat(25)}║
╚════════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

// Start the server
startServer();

export default app;
