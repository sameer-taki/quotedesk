import { Op, fn, col, literal } from 'sequelize';
import { Quote, QuoteLine, Supplier, Category, User } from '../models/index.js';
import { asyncHandler } from '../middleware/validate.js';

/**
 * Get analytics summary
 * GET /api/analytics/summary
 */
export const getSummary = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // Count by status
    const quotes = await Quote.findAll({ where });

    const statusCounts = {
        total: quotes.length,
        draft: quotes.filter(q => q.status === 'draft').length,
        pending: quotes.filter(q => q.status === 'pending').length,
        approved: quotes.filter(q => q.status === 'approved').length,
        rejected: quotes.filter(q => q.status === 'rejected').length,
    };

    // Revenue from approved quotes
    const approvedQuotes = quotes.filter(q => q.status === 'approved');
    const totalRevenue = approvedQuotes.reduce((sum, q) =>
        sum + parseFloat(q.totalSellingIncVat || 0), 0);

    // Average GM%
    const avgGmPercent = approvedQuotes.length > 0
        ? approvedQuotes.reduce((sum, q) => sum + parseFloat(q.overallGmPercent || 0), 0) / approvedQuotes.length
        : 0;

    // Conversion rate
    const conversionRate = statusCounts.total > 0
        ? (statusCounts.approved / statusCounts.total) * 100
        : 0;

    res.json({
        success: true,
        data: {
            ...statusCounts,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            averageGmPercent: Math.round(avgGmPercent * 10000) / 100, // as percentage
            conversionRate: Math.round(conversionRate * 100) / 100,
            averageQuoteValue: approvedQuotes.length > 0
                ? Math.round((totalRevenue / approvedQuotes.length) * 100) / 100
                : 0,
        },
    });
});

/**
 * Get revenue by supplier
 * GET /api/analytics/by-supplier
 */
export const getBySupplier = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const whereQuote = { status: 'approved' };
    if (startDate || endDate) {
        whereQuote.createdAt = {};
        if (startDate) whereQuote.createdAt[Op.gte] = new Date(startDate);
        if (endDate) whereQuote.createdAt[Op.lte] = new Date(endDate);
    }

    // Get approved quotes with lines
    const quotes = await Quote.findAll({
        where: whereQuote,
        include: [{
            model: QuoteLine,
            as: 'lines',
            include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name'] }],
        }],
    });

    // Aggregate by supplier
    const supplierMap = {};
    quotes.forEach(quote => {
        quote.lines.forEach(line => {
            const supplierName = line.supplier?.name || 'Unassigned';
            const supplierId = line.supplier?.id || 'none';

            if (!supplierMap[supplierId]) {
                supplierMap[supplierId] = {
                    id: supplierId,
                    name: supplierName,
                    revenue: 0,
                    lineCount: 0,
                    quoteCount: new Set(),
                };
            }

            supplierMap[supplierId].revenue += parseFloat(line.lineTotalIncVat || 0);
            supplierMap[supplierId].lineCount += 1;
            supplierMap[supplierId].quoteCount.add(quote.id);
        });
    });

    const data = Object.values(supplierMap).map(s => ({
        ...s,
        quoteCount: s.quoteCount.size,
        revenue: Math.round(s.revenue * 100) / 100,
    })).sort((a, b) => b.revenue - a.revenue);

    res.json({
        success: true,
        data,
    });
});

/**
 * Get revenue by category
 * GET /api/analytics/by-category
 */
export const getByCategory = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const whereQuote = { status: 'approved' };
    if (startDate || endDate) {
        whereQuote.createdAt = {};
        if (startDate) whereQuote.createdAt[Op.gte] = new Date(startDate);
        if (endDate) whereQuote.createdAt[Op.lte] = new Date(endDate);
    }

    const quotes = await Quote.findAll({
        where: whereQuote,
        include: [{
            model: QuoteLine,
            as: 'lines',
            include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
        }],
    });

    // Aggregate by category
    const categoryMap = {};
    quotes.forEach(quote => {
        quote.lines.forEach(line => {
            const catName = line.category?.name || 'Uncategorized';
            const catId = line.category?.id || 'none';

            if (!categoryMap[catId]) {
                categoryMap[catId] = {
                    id: catId,
                    name: catName,
                    revenue: 0,
                    lineCount: 0,
                    avgMargin: 0,
                    marginTotal: 0,
                };
            }

            categoryMap[catId].revenue += parseFloat(line.lineTotalIncVat || 0);
            categoryMap[catId].lineCount += 1;
            categoryMap[catId].marginTotal += parseFloat(line.markupPercent || 0);
        });
    });

    const data = Object.values(categoryMap).map(c => ({
        ...c,
        revenue: Math.round(c.revenue * 100) / 100,
        avgMargin: c.lineCount > 0
            ? Math.round((c.marginTotal / c.lineCount) * 10000) / 100
            : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    res.json({
        success: true,
        data,
    });
});

/**
 * Get monthly trends (last 12 months)
 * GET /api/analytics/trends
 */
export const getTrends = asyncHandler(async (req, res) => {
    const months = parseInt(req.query.months) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const quotes = await Quote.findAll({
        where: {
            createdAt: { [Op.gte]: startDate },
        },
        order: [['createdAt', 'ASC']],
    });

    // Group by month
    const monthlyData = {};
    quotes.forEach(quote => {
        const monthKey = quote.createdAt.toISOString().substring(0, 7); // YYYY-MM

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                month: monthKey,
                totalQuotes: 0,
                approved: 0,
                rejected: 0,
                pending: 0,
                draft: 0,
                revenue: 0,
                avgGmPercent: 0,
                gmTotal: 0,
            };
        }

        monthlyData[monthKey].totalQuotes += 1;
        monthlyData[monthKey][quote.status] = (monthlyData[monthKey][quote.status] || 0) + 1;

        if (quote.status === 'approved') {
            monthlyData[monthKey].revenue += parseFloat(quote.totalSellingIncVat || 0);
            monthlyData[monthKey].gmTotal += parseFloat(quote.overallGmPercent || 0);
        }
    });

    const data = Object.values(monthlyData).map(m => ({
        ...m,
        revenue: Math.round(m.revenue * 100) / 100,
        avgGmPercent: m.approved > 0
            ? Math.round((m.gmTotal / m.approved) * 10000) / 100
            : 0,
        conversionRate: m.totalQuotes > 0
            ? Math.round((m.approved / m.totalQuotes) * 10000) / 100
            : 0,
    }));

    res.json({
        success: true,
        data,
    });
});

/**
 * Export analytics data as CSV
 * GET /api/analytics/export
 */
export const exportAnalytics = asyncHandler(async (req, res) => {
    const { type = 'summary', startDate, endDate } = req.query;

    let csvContent = '';

    if (type === 'quotes') {
        const where = {};
        if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
        if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate) };

        const quotes = await Quote.findAll({
            where,
            include: [
                { model: User, as: 'creator', attributes: ['name'] },
            ],
            order: [['createdAt', 'DESC']],
        });

        csvContent = 'Quote Number,Client,Status,Created,Creator,Total (Inc VAT),GM %\n';
        quotes.forEach(q => {
            csvContent += `"${q.quoteNumber}","${q.clientName}","${q.status}","${q.createdAt.toISOString().split('T')[0]}","${q.creator?.name || ''}","${q.totalSellingIncVat}","${(q.overallGmPercent * 100).toFixed(2)}%"\n`;
        });
    } else {
        // Summary export
        const quotes = await Quote.findAll();
        const approved = quotes.filter(q => q.status === 'approved');
        const totalRevenue = approved.reduce((sum, q) => sum + parseFloat(q.totalSellingIncVat || 0), 0);

        csvContent = 'Metric,Value\n';
        csvContent += `Total Quotes,${quotes.length}\n`;
        csvContent += `Approved,${approved.length}\n`;
        csvContent += `Pending,${quotes.filter(q => q.status === 'pending').length}\n`;
        csvContent += `Rejected,${quotes.filter(q => q.status === 'rejected').length}\n`;
        csvContent += `Draft,${quotes.filter(q => q.status === 'draft').length}\n`;
        csvContent += `Total Revenue,${totalRevenue.toFixed(2)}\n`;
        csvContent += `Conversion Rate,${((approved.length / quotes.length) * 100).toFixed(2)}%\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
});

export default {
    getSummary,
    getBySupplier,
    getByCategory,
    getTrends,
    exportAnalytics,
};
