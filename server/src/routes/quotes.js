import express from 'express';
import quoteController from '../controllers/quoteController.js';
import exportController from '../controllers/exportController.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public portal routes (No authentication required)
router.get('/public/:publicId', quoteController.getPublicQuote);
router.post('/public/:publicId/accept', quoteController.acceptQuote);

// All other routes require authentication
router.use(authenticate);

// List quotes (all authenticated users)
router.get('/', quoteController.listQuotes);

// Get single quote
router.get('/:id', quoteController.getQuote);

// Create quote (creator, admin)
router.post('/',
    authorize('creator', 'admin'),
    quoteController.createQuoteValidation,
    validate,
    quoteController.createQuote
);

// Update quote (creator, admin)
router.put('/:id',
    authorize('creator', 'admin'),
    quoteController.updateQuoteValidation,
    validate,
    quoteController.updateQuote
);

// Delete quote (admin only - requires admin approval)
router.delete('/:id',
    authorize('admin'),
    quoteController.deleteQuote
);

// Submit for approval
router.post('/:id/submit',
    authorize('creator', 'admin'),
    quoteController.submitQuote
);

// Approve quote (admin only)
router.post('/:id/approve',
    authorize('admin'),
    quoteController.approveQuote
);

// Reject quote (admin only)
router.post('/:id/reject',
    authorize('admin'),
    quoteController.rejectQuote
);

// Clone quote (creator, admin)
router.post('/:id/clone',
    authorize('creator', 'admin'),
    quoteController.cloneQuote
);

// Get quote versions
router.get('/:id/versions',
    quoteController.getVersions
);

// Create amendment (creator, admin - only for approved quotes)
router.post('/:id/amend',
    authorize('creator', 'admin'),
    quoteController.amendQuote
);

// Analyze quote (intelligence)
router.post('/:id/analyze',
    authorize('creator', 'admin', 'approver'),
    quoteController.analyzeQuote
);

// Generate Vendor POs
router.post('/:id/generate-po',
    authorize('creator', 'admin'),
    quoteController.generatePO
);

// Export routes
router.get('/:id/export/pdf', exportController.exportPdf);
router.get('/:id/export/excel', exportController.exportExcel);

export default router;
