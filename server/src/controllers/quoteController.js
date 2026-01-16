import { body, param, query } from 'express-validator';
import { Op } from 'sequelize';
import { Quote, QuoteLine, QuoteRevision, User, Supplier, Category, Setting } from '../models/index.js';
import { calculateLine, calculateQuoteTotals, checkApprovalRequired } from '../services/calculations.js';
import { sendQuoteApprovedEmail, sendQuoteRejectedEmail } from '../services/email.js';
import { createAuditLog } from '../middleware/audit.js';
import { asyncHandler } from '../middleware/validate.js';
import intelligenceService from '../services/intelligenceService.js';
import workflowService from '../services/workflowService.js';
import config from '../config/env.js';

/**
 * Validation rules
 */
export const createQuoteValidation = [
    body('clientName').notEmpty().withMessage('Client name is required'),
    body('notes').optional().isString(),
    body('footerNotes').optional().isString(),
    body('lines').optional().isArray(),
];

export const updateQuoteValidation = [
    param('id').isUUID().withMessage('Invalid quote ID'),
    body('clientName').optional().notEmpty(),
    body('lines').optional().isArray(),
];

export const lineValidation = [
    body('lines.*.description').notEmpty().withMessage('Description is required'),
    body('lines.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('lines.*.buyPrice').isFloat({ min: 0 }).withMessage('Buy price must be positive'),
];

/**
 * Generate next quote number
 */
const generateQuoteNumber = async () => {
    const year = new Date().getFullYear();
    const prefix = `QF-${year}-`;

    const lastQuote = await Quote.findOne({
        where: {
            quoteNumber: {
                [Op.like]: `${prefix}%`,
            },
        },
        order: [['quoteNumber', 'DESC']],
    });

    let nextNum = 1;
    if (lastQuote) {
        const lastNum = parseInt(lastQuote.quoteNumber.split('-').pop(), 10);
        nextNum = lastNum + 1;
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
};

/**
 * Get VAT rate from settings
 */
const getVatRate = async () => {
    const vatSetting = await Setting.findByPk('vat_rate');
    return vatSetting ? parseFloat(vatSetting.value) : config.app.vatRate;
};

/**
 * Get quote validity days from settings
 */
const getValidityDays = async () => {
    const setting = await Setting.findByPk('quote_validity_days');
    return setting ? parseInt(setting.value, 10) : config.app.quoteValidityDays;
};

/**
 * List quotes with filtering
 * GET /api/quotes
 */
export const listQuotes = asyncHandler(async (req, res) => {
    const {
        status,
        client,
        startDate,
        endDate,
        isTemplate,
        page = 1,
        limit = 20,
        sort = 'createdAt',
        order = 'DESC',
    } = req.query;

    const where = {};

    // Filter by template status (Default to false to hide templates from main list)
    if (isTemplate !== undefined) {
        where.isTemplate = isTemplate === 'true';
    } else {
        where.isTemplate = false;
    }

    // Filter by status
    if (status) {
        where.status = status;
    }

    // Filter by client name
    if (client) {
        where.clientName = { [Op.like]: `%${client}%` };
    }

    // Filter by date range
    if (startDate && endDate) {
        where.quoteDate = {
            [Op.between]: [startDate, endDate],
        };
    }

    // For viewers, only show approved quotes
    if (req.user.role === 'viewer') {
        where.status = 'approved';
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows: quotes } = await Quote.findAndCountAll({
        where,
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
            { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
        ],
        order: [[sort, order.toUpperCase()]],
        limit: parseInt(limit, 10),
        offset,
    });

    res.json({
        success: true,
        data: {
            quotes,
            pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                total: count,
                pages: Math.ceil(count / parseInt(limit, 10)),
            },
        },
    });
});

/**
 * Get single quote with lines
 * GET /api/quotes/:id
 */
export const getQuote = asyncHandler(async (req, res) => {
    const quote = await Quote.findByPk(req.params.id, {
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
            { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
            {
                model: QuoteLine,
                as: 'lines',
                include: [
                    { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'defaultCurrency'] },
                    { model: Category, as: 'category', attributes: ['id', 'name'] },
                ],
                order: [['lineNumber', 'ASC']],
            },
        ],
    });

    if (!quote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found',
        });
    }

    res.json({
        success: true,
        data: quote,
    });
});

/**
 * Create new quote
 * POST /api/quotes
 */
export const createQuote = asyncHandler(async (req, res) => {
    const { clientName, notes, footerNotes, lines = [], isTemplate = false } = req.body;

    const vatRate = await getVatRate();
    const validityDays = await getValidityDays();

    // Generate quote number (Templates get prefix T-?)
    // For now, normal quote number.
    const quoteNumber = await generateQuoteNumber();

    // Calculate valid until date
    const quoteDate = new Date();
    const validUntil = new Date(quoteDate);
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Create quote
    const quote = await Quote.create({
        quoteNumber,
        clientName: isTemplate ? (clientName || 'Template') : clientName,
        quoteDate,
        validUntil,
        status: 'draft',
        creatorId: req.user.id,
        notes,
        footerNotes,
        isTemplate,
    });

    // Process and create lines
    const createdLines = [];
    for (let i = 0; i < lines.length; i++) {
        const lineData = lines[i];

        // Calculate line values
        const calculated = calculateLine({
            buyPrice: lineData.buyPrice,
            freightRate: lineData.freightRate || 0,
            exchangeRate: lineData.exchangeRate,
            dutyRate: lineData.dutyRate || 0,
            handlingRate: lineData.handlingRate || 0,
            quantity: lineData.quantity,
            targetMarkupPercent: lineData.targetMarkupPercent || 0.25,
            overrideMarkupPercent: lineData.overrideMarkupPercent,
        }, vatRate);

        const line = await QuoteLine.create({
            quoteId: quote.id,
            lineNumber: i + 1,
            partNumber: lineData.partNumber,
            description: lineData.description,
            supplierId: lineData.supplierId,
            categoryId: lineData.categoryId,
            quantity: lineData.quantity,
            buyPrice: lineData.buyPrice,
            currency: lineData.currency || 'NZD',
            freightRate: lineData.freightRate || 0,
            exchangeRate: lineData.exchangeRate,
            dutyRate: lineData.dutyRate || 0,
            handlingRate: lineData.handlingRate || 0,
            targetMarkupPercent: lineData.targetMarkupPercent || 0.25,
            overrideMarkupPercent: lineData.overrideMarkupPercent,
            ...calculated,
        });

        createdLines.push(line);
    }

    // Calculate quote totals
    const totals = calculateQuoteTotals(createdLines);
    await quote.update({
        totalLandedCost: totals.totalLandedCost,
        totalSellingExVat: totals.totalSellingExVat,
        totalVat: totals.totalVat,
        totalSellingIncVat: totals.totalSellingIncVat,
        overallGmPercent: totals.overallGmPercent,
    });

    // Log the action
    await createAuditLog(req.user.id, 'create', 'quote', quote.id, { quoteNumber, clientName }, req);

    // Fetch complete quote with lines
    const createdQuote = await Quote.findByPk(quote.id, {
        include: [
            { model: QuoteLine, as: 'lines' },
        ],
    });

    res.status(201).json({
        success: true,
        data: createdQuote,
    });
});

/**
 * Update quote
 * PUT /api/quotes/:id
 */
export const updateQuote = asyncHandler(async (req, res) => {
    const quote = await Quote.findByPk(req.params.id);

    if (!quote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found',
        });
    }

    // Only draft quotes can be edited
    if (quote.status !== 'draft' && req.user.role !== 'admin') {
        return res.status(400).json({
            success: false,
            message: 'Only draft quotes can be edited',
        });
    }

    const { clientName, notes, footerNotes, lines } = req.body;
    const vatRate = await getVatRate();

    // Update quote fields
    await quote.update({
        clientName: clientName || quote.clientName,
        notes: notes !== undefined ? notes : quote.notes,
        footerNotes: footerNotes !== undefined ? footerNotes : quote.footerNotes,
    });

    // If lines provided, replace all lines
    if (lines && Array.isArray(lines)) {
        // Delete existing lines
        await QuoteLine.destroy({ where: { quoteId: quote.id } });

        // Create new lines
        const createdLines = [];
        for (let i = 0; i < lines.length; i++) {
            const lineData = lines[i];

            const calculated = calculateLine({
                buyPrice: lineData.buyPrice,
                freightRate: lineData.freightRate || 0,
                exchangeRate: lineData.exchangeRate,
                dutyRate: lineData.dutyRate || 0,
                handlingRate: lineData.handlingRate || 0,
                quantity: lineData.quantity,
                targetMarkupPercent: lineData.targetMarkupPercent || 0.25,
                overrideMarkupPercent: lineData.overrideMarkupPercent,
            }, vatRate);

            const line = await QuoteLine.create({
                quoteId: quote.id,
                lineNumber: i + 1,
                partNumber: lineData.partNumber,
                description: lineData.description,
                supplierId: lineData.supplierId,
                categoryId: lineData.categoryId,
                quantity: lineData.quantity,
                buyPrice: lineData.buyPrice,
                currency: lineData.currency || 'NZD',
                freightRate: lineData.freightRate || 0,
                exchangeRate: lineData.exchangeRate,
                dutyRate: lineData.dutyRate || 0,
                handlingRate: lineData.handlingRate || 0,
                targetMarkupPercent: lineData.targetMarkupPercent || 0.25,
                overrideMarkupPercent: lineData.overrideMarkupPercent,
                ...calculated,
            });

            createdLines.push(line);
        }

        // Update quote totals
        const totals = calculateQuoteTotals(createdLines);
        await quote.update({
            totalLandedCost: totals.totalLandedCost,
            totalSellingExVat: totals.totalSellingExVat,
            totalVat: totals.totalVat,
            totalSellingIncVat: totals.totalSellingIncVat,
            overallGmPercent: totals.overallGmPercent,
        });
    }

    // Log the action
    await createAuditLog(req.user.id, 'update', 'quote', quote.id, {}, req);

    // Fetch updated quote
    const updatedQuote = await Quote.findByPk(quote.id, {
        include: [{ model: QuoteLine, as: 'lines' }],
    });

    res.json({
        success: true,
        data: updatedQuote,
    });
});

/**
 * Delete quote
 * DELETE /api/quotes/:id
 */
export const deleteQuote = asyncHandler(async (req, res) => {
    const quote = await Quote.findByPk(req.params.id);

    if (!quote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found',
        });
    }

    // Admin-only deletion is enforced at route level
    const quoteNumber = quote.quoteNumber;

    // Manually delete child records first to avoid FK constraints
    // (SQLite doesn't enforce CASCADE in existing tables)
    await QuoteLine.destroy({ where: { quoteId: req.params.id } });
    await QuoteRevision.destroy({ where: { quoteId: req.params.id } });

    // Now delete the quote itself
    await quote.destroy();

    // Log the action
    await createAuditLog(req.user.id, 'delete', 'quote', req.params.id, { quoteNumber }, req);

    res.json({
        success: true,
        message: 'Quote deleted successfully',
    });
});

/**
 * Submit quote for approval
 * POST /api/quotes/:id/submit
 */
export const submitQuote = asyncHandler(async (req, res) => {
    const quote = await Quote.findByPk(req.params.id, {
        include: [{ model: QuoteLine, as: 'lines' }],
    });

    if (!quote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found',
        });
    }

    if (quote.status !== 'draft') {
        return res.status(400).json({
            success: false,
            message: 'Only draft quotes can be submitted',
        });
    }

    if (quote.lines.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Quote must have at least one line item',
        });
    }

    // Check if approval is required
    const smartApprovalSetting = await Setting.findByPk('smart_approval_floor');
    const floor = smartApprovalSetting ? parseFloat(smartApprovalSetting.value) : 0.15; // Default 15%

    const approvalCheck = checkApprovalRequired(quote.overallGmPercent, { lowGmThreshold: floor });

    if (approvalCheck.requiresApproval) {
        await quote.update({ status: 'pending' });
    } else {
        // Smart Approval: Margin is good enough to auto-approve
        await quote.update({
            status: 'approved',
            approverId: req.user.id,
            approverComments: `Auto-approved via Smart Approvals (Margin: ${(quote.overallGmPercent * 100).toFixed(2)}% > ${(floor * 100).toFixed(2)}%)`
        });
    }

    // Log the action
    await createAuditLog(req.user.id, 'submit', 'quote', quote.id, {
        requiresApproval: approvalCheck.requiresApproval,
        gmPercent: quote.overallGmPercent,
        autoApproved: !approvalCheck.requiresApproval
    }, req);

    res.json({
        success: true,
        data: {
            status: quote.status,
            requiresApproval: approvalCheck.requiresApproval,
            autoApproved: !approvalCheck.requiresApproval,
            ...approvalCheck,
        },
    });
});

/**
 * Approve quote
 * POST /api/quotes/:id/approve
 */
export const approveQuote = asyncHandler(async (req, res) => {
    const { comments } = req.body;
    const quote = await Quote.findByPk(req.params.id, {
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        ],
    });

    if (!quote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found',
        });
    }

    if (quote.status !== 'pending') {
        return res.status(400).json({
            success: false,
            message: 'Only pending quotes can be approved',
        });
    }

    await quote.update({
        status: 'approved',
        approverId: req.user.id,
        approverComments: comments,
    });

    // Fetch approver details for the email
    const approver = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'email'] });
    quote.approver = approver;

    // Send email notification to the quote creator
    if (quote.creator && quote.creator.email) {
        await sendQuoteApprovedEmail(quote, quote.creator, null);
    }

    // Log the action
    await createAuditLog(req.user.id, 'approve', 'quote', quote.id, { comments }, req);

    res.json({
        success: true,
        data: quote,
    });
});

/**
 * Reject quote
 * POST /api/quotes/:id/reject
 */
export const rejectQuote = asyncHandler(async (req, res) => {
    const { comments } = req.body;
    const quote = await Quote.findByPk(req.params.id);

    if (!quote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found',
        });
    }

    if (quote.status !== 'pending') {
        return res.status(400).json({
            success: false,
            message: 'Only pending quotes can be rejected',
        });
    }

    await quote.update({
        status: 'rejected',
        approverId: req.user.id,
        approverComments: comments,
    });

    // Log the action
    await createAuditLog(req.user.id, 'reject', 'quote', quote.id, { comments }, req);

    res.json({
        success: true,
        data: quote,
    });
});

/**
 * Clone quote - Create a copy of an existing quote
 * POST /api/quotes/:id/clone
 */
export const cloneQuote = asyncHandler(async (req, res) => {
    const originalQuote = await Quote.findByPk(req.params.id, {
        include: [{ model: QuoteLine, as: 'lines' }],
    });

    if (!originalQuote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found',
        });
    }

    const vatRate = await getVatRate();
    const validityDays = await getValidityDays();
    const quoteNumber = await generateQuoteNumber();

    const quoteDate = new Date();
    const validUntil = new Date(quoteDate);
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Create cloned quote
    const clonedQuote = await Quote.create({
        quoteNumber,
        clientName: originalQuote.clientName + ' (Copy)',
        quoteDate,
        validUntil,
        status: 'draft',
        creatorId: req.user.id,
        notes: originalQuote.notes,
        footerNotes: originalQuote.footerNotes,
        totalLandedCost: originalQuote.totalLandedCost,
        totalSellingExVat: originalQuote.totalSellingExVat,
        totalVat: originalQuote.totalVat,
        totalSellingIncVat: originalQuote.totalSellingIncVat,
        overallGmPercent: originalQuote.overallGmPercent,
    });

    // Clone all lines
    for (const line of originalQuote.lines) {
        await QuoteLine.create({
            quoteId: clonedQuote.id,
            lineNumber: line.lineNumber,
            partNumber: line.partNumber,
            description: line.description,
            supplierId: line.supplierId,
            categoryId: line.categoryId,
            quantity: line.quantity,
            buyPrice: line.buyPrice,
            currency: line.currency,
            freightRate: line.freightRate,
            exchangeRate: line.exchangeRate,
            dutyRate: line.dutyRate,
            handlingRate: line.handlingRate,
            targetMarkupPercent: line.targetMarkupPercent,
            overrideMarkupPercent: line.overrideMarkupPercent,
            freightAmount: line.freightAmount,
            dutyAmount: line.dutyAmount,
            handlingAmount: line.handlingAmount,
            landedCost: line.landedCost,
            markupPercent: line.markupPercent,
            markupAmount: line.markupAmount,
            unitSellExVat: line.unitSellExVat,
            lineTotalExVat: line.lineTotalExVat,
            vatAmount: line.vatAmount,
            lineTotalIncVat: line.lineTotalIncVat,
        });
    }

    await createAuditLog(req.user.id, 'clone', 'quote', clonedQuote.id, {
        originalQuoteId: originalQuote.id,
        originalQuoteNumber: originalQuote.quoteNumber,
    }, req);

    const result = await Quote.findByPk(clonedQuote.id, {
        include: [{ model: QuoteLine, as: 'lines' }],
    });

    res.status(201).json({
        success: true,
        message: `Quote cloned successfully as ${quoteNumber}`,
        data: result,
    });
});

/**
 * Get quote versions/revisions
 * GET /api/quotes/:id/versions
 */
export const getVersions = asyncHandler(async (req, res) => {
    const { QuoteRevision } = await import('../models/index.js');

    const quote = await Quote.findByPk(req.params.id);
    if (!quote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found',
        });
    }

    const versions = await QuoteRevision.findAll({
        where: { quoteId: req.params.id },
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
        order: [['revisionNumber', 'DESC']],
    });

    res.json({
        success: true,
        data: versions,
    });
});

/**
 * Create amendment to approved quote
 * POST /api/quotes/:id/amend
 */
export const amendQuote = asyncHandler(async (req, res) => {
    const originalQuote = await Quote.findByPk(req.params.id, {
        include: [{ model: QuoteLine, as: 'lines' }],
    });

    if (!originalQuote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found',
        });
    }

    if (originalQuote.status !== 'approved') {
        return res.status(400).json({
            success: false,
            message: 'Only approved quotes can be amended',
        });
    }

    const quoteNumber = originalQuote.quoteNumber + '-A' + (originalQuote.revisionNumber + 1);
    const validityDays = await getValidityDays();

    const quoteDate = new Date();
    const validUntil = new Date(quoteDate);
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Create amendment quote
    const amendment = await Quote.create({
        quoteNumber,
        clientName: originalQuote.clientName,
        quoteDate,
        validUntil,
        status: 'draft',
        creatorId: req.user.id,
        notes: originalQuote.notes,
        footerNotes: originalQuote.footerNotes,
        parentQuoteId: originalQuote.id,
        revisionNumber: originalQuote.revisionNumber + 1,
        totalLandedCost: originalQuote.totalLandedCost,
        totalSellingExVat: originalQuote.totalSellingExVat,
        totalVat: originalQuote.totalVat,
        totalSellingIncVat: originalQuote.totalSellingIncVat,
        overallGmPercent: originalQuote.overallGmPercent,
    });

    // Clone all lines
    for (const line of originalQuote.lines) {
        await QuoteLine.create({
            quoteId: amendment.id,
            lineNumber: line.lineNumber,
            partNumber: line.partNumber,
            description: line.description,
            supplierId: line.supplierId,
            categoryId: line.categoryId,
            quantity: line.quantity,
            buyPrice: line.buyPrice,
            currency: line.currency,
            freightRate: line.freightRate,
            exchangeRate: line.exchangeRate,
            dutyRate: line.dutyRate,
            handlingRate: line.handlingRate,
            targetMarkupPercent: line.targetMarkupPercent,
            overrideMarkupPercent: line.overrideMarkupPercent,
            freightAmount: line.freightAmount,
            dutyAmount: line.dutyAmount,
            handlingAmount: line.handlingAmount,
            landedCost: line.landedCost,
            markupPercent: line.markupPercent,
            markupAmount: line.markupAmount,
            unitSellExVat: line.unitSellExVat,
            lineTotalExVat: line.lineTotalExVat,
            vatAmount: line.vatAmount,
            lineTotalIncVat: line.lineTotalIncVat,
        });
    }

    await createAuditLog(req.user.id, 'amend', 'quote', amendment.id, {
        originalQuoteId: originalQuote.id,
        originalQuoteNumber: originalQuote.quoteNumber,
    }, req);

    const result = await Quote.findByPk(amendment.id, {
        include: [{ model: QuoteLine, as: 'lines' }],
    });

    res.status(201).json({
        success: true,
        message: `Amendment created as ${quoteNumber}`,
        data: result,
    });
});

/**
 * Get public quote for client portal
 * GET /api/quotes/public/:publicId
 */
export const getPublicQuote = asyncHandler(async (req, res) => {
    const quote = await Quote.findOne({
        where: { publicId: req.params.publicId },
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
            {
                model: QuoteLine,
                as: 'lines',
                attributes: ['id', 'lineNumber', 'description', 'partNumber', 'quantity', 'unitSellExVat', 'lineTotalExVat', 'vatAmount', 'lineTotalIncVat'],
                order: [['lineNumber', 'ASC']],
            },
        ],
    });

    if (!quote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found or invalid link',
        });
    }

    // Increment view count
    await quote.increment('viewCount');

    res.json({
        success: true,
        data: quote,
    });
});

/**
 * Accept quote from client portal
 * POST /api/quotes/public/:publicId/accept
 */
export const acceptQuote = asyncHandler(async (req, res) => {
    const { acceptedBy } = req.body;

    if (!acceptedBy) {
        return res.status(400).json({
            success: false,
            message: 'Name is required for acceptance',
        });
    }

    const quote = await Quote.findOne({
        where: { publicId: req.params.publicId }
    });

    if (!quote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found',
        });
    }

    if (quote.status !== 'approved') {
        return res.status(400).json({
            success: false,
            message: 'Only approved quotes can be accepted',
        });
    }

    await quote.update({
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: acceptedBy
    });

    res.json({
        success: true,
        message: 'Quote accepted successfully!',
        data: {
            status: 'accepted',
            acceptedAt: quote.acceptedAt,
            acceptedBy: quote.acceptedBy
        }
    });
});

/**
 * Analyze Quote for Intelligence (Win Prob, Bundles, Price Check)
 * POST /api/quotes/:id/analyze
 */
export const analyzeQuote = asyncHandler(async (req, res) => {
    const quote = await Quote.findByPk(req.params.id, {
        include: [{ model: QuoteLine, as: 'lines' }]
    });

    if (!quote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found',
        });
    }

    // 1. Calculate Win Probability
    const winProb = await intelligenceService.calculateWinProbability(quote);

    // 2. Variable Bundling Suggestions
    const bundles = await intelligenceService.getSmartBundles(quote.lines);

    // 3. Competitor Price Check
    const competitorAlerts = await intelligenceService.checkCompetitorPrices(quote.lines);

    res.json({
        success: true,
        data: {
            winProbability: winProb,
            bundles,
            competitorAlerts
        }
    });
});

/**
 * Generate Vendor POs
 * POST /api/quotes/:id/generate-po
 */
export const generatePO = asyncHandler(async (req, res) => {
    const pos = await workflowService.generateVendorPO(req.params.id);
    res.json({
        success: true,
        data: pos
    });
});

export default {
    listQuotes,
    getQuote,
    createQuote,
    updateQuote,
    deleteQuote,
    submitQuote,
    approveQuote,
    rejectQuote,
    cloneQuote,
    getVersions,
    amendQuote,
    getPublicQuote,
    acceptQuote,
    analyzeQuote,
    generatePO,
    createQuoteValidation,
    updateQuoteValidation,
    lineValidation,
};
