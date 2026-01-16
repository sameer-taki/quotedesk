import { Sequelize } from 'sequelize';
import config from './env.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use SQLite for development (no external database required)
const dbPath = path.join(__dirname, '../../data/quoteforge.sqlite');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: config.env === 'development' ? console.log : false,
    define: {
        timestamps: true,
        underscored: true,
    }
});

export const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✓ Database connection established successfully.');
        console.log(`  Using SQLite database: ${dbPath}`);
        return true;
    } catch (error) {
        console.error('✗ Unable to connect to the database:', error.message);
        return false;
    }
};

export default sequelize;
