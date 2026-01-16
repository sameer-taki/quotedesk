import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

// GET /api/analytics/summary - Overview stats
router.get('/summary', analyticsController.getSummary);

// GET /api/analytics/by-supplier - Revenue breakdown by supplier
router.get('/by-supplier', analyticsController.getBySupplier);

// GET /api/analytics/by-category - Revenue breakdown by category
router.get('/by-category', analyticsController.getByCategory);

// GET /api/analytics/trends - Monthly trends (last 12 months)
router.get('/trends', analyticsController.getTrends);

// GET /api/analytics/export - Export analytics data as CSV
router.get('/export', analyticsController.exportAnalytics);

export default router;
