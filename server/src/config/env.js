import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  
  db: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'quoteforge',
    user: process.env.DB_USER || 'quoteforge',
    password: process.env.DB_PASSWORD || '',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '30m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  app: {
    baseCurrency: process.env.BASE_CURRENCY || 'FJD',
    vatRate: parseFloat(process.env.VAT_RATE) || 0.125,
    quoteValidityDays: parseInt(process.env.QUOTE_VALIDITY_DAYS, 10) || 14,
  },
  
  fx: {
    apiUrl: process.env.FX_API_URL || 'https://api.frankfurter.app',
    staleHours: parseInt(process.env.FX_STALE_HOURS, 10) || 240,
  },
  
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'QuoteForge <noreply@kastel.local>',
  },
  
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export default config;
