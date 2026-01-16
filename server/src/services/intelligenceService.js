import { Op } from 'sequelize';
import { Quote, Product, ProductRelationship, CompetitorProduct, Customer, User, QuoteLine, Setting } from '../models/index.js';

/**
 * SKILL-QUOTE-SCORER
 * Deterministic Heuristic Scoring Engine
 * 
 * Rules:
 * 1. Margin Health (40%): Score 40 if margin > 30%; 0 if < 10%. Linear scale.
 * 2. Customer Relationship (20%): +20 Existing (w/ history), -10 New.
 * 3. Quote Velocity (20%): +20 if turn-around < 4hr. -5 per 24h beyond.
 * 4. Product Fit (10%): +10 if 80% items are Stock/Standard. -10 if >20% Custom.
 * 5. Discount Depth (10%): -10 if total discount > 5% without approval.
 */
export const calculateWinProbability = async (quote) => {
    let score = 0; // Base score starts at 0, builds up
    const factors = [];
    const now = new Date();

    // --- 1. Margin Health (Max 40 points) ---
    const gmPercent = parseFloat(quote.overallGmPercent) || 0;
    let marginScore = 0;
    if (gmPercent >= 0.30) {
        marginScore = 40;
    } else if (gmPercent <= 0.10) {
        marginScore = 0;
    } else {
        // Linear interpolation between 0.10 (0pts) and 0.30 (40pts)
        // Ratio = (gm - 0.10) / (0.20)
        marginScore = ((gmPercent - 0.10) / 0.20) * 40;
    }
    marginScore = Math.round(marginScore);
    score += marginScore;
    factors.push({
        factor: 'Margin Health',
        impact: `+${marginScore}`,
        description: `GM ${Math.round(gmPercent * 100)}% yields ${marginScore}/40 points`
    });

    // --- 2. Customer Relationship (Max 20 points) ---
    let customerScore = 0;
    if (quote.customerId) {
        const customer = await Customer.findByPk(quote.customerId);
        if (customer) {
            // Check for previous accepted quotes to define "Existing" vs "New"
            const acceptedCount = await Quote.count({
                where: {
                    customerId: quote.customerId,
                    status: 'accepted',
                    id: { [Op.ne]: quote.id } // Exclude current
                }
            });

            if (acceptedCount > 0) {
                customerScore = 20;
                factors.push({ factor: 'Customer Relationship', impact: '+20', description: 'Existing customer with history' });
            } else {
                customerScore = -10;
                factors.push({ factor: 'Customer Relationship', impact: '-10', description: 'New customer (no history)' });
            }
        }
    }
    score += customerScore;

    // --- 3. Quote Velocity (Max 20 points) ---
    // Compare created time vs now. "Turnaround" is effectively "Age" here until sent.
    // Assuming calculation happens on update/view.
    const created = new Date(quote.createdAt || now);
    const ageHours = (now - created) / (1000 * 60 * 60);

    let velocityScore = 0;
    if (ageHours <= 4) {
        velocityScore = 20;
        factors.push({ factor: 'Quote Velocity', impact: '+20', description: 'Turnaround within 4 hours' });
    } else {
        // -5 for every 24h thereafter (starting after first 24h block? "thereafter" implies >4h)
        // Let's interpret: <4h=20. >4h starts degrading?
        // Rules say: "-5 for every 24 hours thereafter".
        // Let's assume >4h gets 0 baseline, then penalties? Or does it degrade from 20?
        // Common interp: You miss the bonus. Then penalties start late.
        // Let's implement: <4h = 20. >4h && <24h = 0. >24h = -5 * days.
        if (ageHours > 24) {
            const daysOver = Math.ceil((ageHours - 24) / 24);
            velocityScore = -5 * daysOver;
            factors.push({ factor: 'Quote Velocity', impact: `${velocityScore}`, description: `Delayed by ${daysOver} day(s)` });
        } else {
            factors.push({ factor: 'Quote Velocity', impact: '0', description: 'Standard turnaround (>4h, <24h)' });
        }
    }
    score += velocityScore;

    // --- 4. Product Fit (Max 10 points) ---
    // Fetch lines to check Product stockStatus
    let productScore = 0;
    if (quote.lines && quote.lines.length > 0) {
        // We need to fetch the actual product definitions
        // quote.lines currently has partNumber, we need to lookup Products to check stockStatus
        // Optimization: Use `partNumber` (sku) to find Products.
        const skus = quote.lines.map(l => l.partNumber).filter(Boolean);
        const products = await Product.findAll({
            where: { sku: { [Op.in]: skus } }
        });

        const productMap = {};
        products.forEach(p => productMap[p.sku] = p.stockStatus);

        let standardCount = 0;
        let customCount = 0;
        let totalItems = 0;

        quote.lines.forEach(line => {
            if (!line.partNumber) return;
            totalItems++;
            const status = productMap[line.partNumber] || 'Standard'; // Default if not found
            if (['In Stock', 'Standard'].includes(status)) {
                standardCount++;
            } else if (['Custom', 'Special Order'].includes(status)) {
                customCount++;
            }
        });

        if (totalItems > 0) {
            const standardPct = standardCount / totalItems;
            const customPct = customCount / totalItems;

            if (standardPct >= 0.80) {
                productScore = 10;
                factors.push({ factor: 'Product Fit', impact: '+10', description: 'High volume of standard items' });
            } else if (customPct > 0.20) {
                productScore = -10;
                factors.push({ factor: 'Product Fit', impact: '-10', description: 'High volume of custom/special orders' });
            }
        }
    }
    score += productScore;

    // --- 5. Discount Depth (Max 10 points - Penalty check) ---
    // Rule: -10 if total discount > 5% without approval.
    // Total Discount = (TotalSell - TotalSellAfterDiscount) / TotalSell ? 
    // Or just look at overall GM? Simplest is to assume standard margin is X, and compare.
    // Let's use the explicit `discount` field if it exists, or derive from buy/sell.
    // "Total discount exceeds standard 5% threshold".
    // This implies we check the effective discount given from "Base Price".
    // Since we don't always track "List Price" on quote lines explicitly (just buy/sell), 
    // we can check if `targetMarkup` was overridden downwards.
    // Simplification for now: Use GM. If GM < 20% (assuming 25% target), treat as >5% discount.
    // BETTER: Check `status`. If 'approved' (by manager), no penalty.

    let discountScore = 0;
    // Heuristic: If GM < 20% (approx 5% discount from 25% standard) AND NOT approved
    if (gmPercent < 0.20 && quote.status !== 'approved' && quote.status !== 'accepted') {
        discountScore = -10;
        factors.push({ factor: 'Discount Depth', impact: '-10', description: 'High discount without manager approval' });
    } else if (gmPercent < 0.20) {
        factors.push({ factor: 'Discount Depth', impact: '0', description: 'High discount approved by manager' });
    }
    score += discountScore;

    // Clamp score 0-100
    score = Math.max(0, Math.min(100, score));

    // Save calculation
    await quote.update({
        winProbability: score,
        aiAnalysis: { score, factors, calculatedAt: new Date() }
    });

    return { score, factors };
};

/**
 * Get Smart Bundle Suggestions
 * Returns a list of products that are related to the items currently in the quote.
 */
export const getSmartBundles = async (quoteLines) => {
    if (!quoteLines || quoteLines.length === 0) return [];

    const partNumbers = quoteLines.map(l => l.partNumber).filter(Boolean);
    if (partNumbers.length === 0) return [];

    const products = await Product.findAll({
        where: { sku: { [Op.in]: partNumbers } }
    });

    const productIds = products.map(p => p.id);

    const relationships = await ProductRelationship.findAll({
        where: { parentProductId: { [Op.in]: productIds } },
        include: [{
            model: Product,
            as: 'childProduct',
            attributes: ['id', 'sku', 'name', 'basePrice', 'description']
        }]
    });

    const suggestions = relationships.map(rel => ({
        id: rel.childProduct.id,
        sku: rel.childProduct.sku,
        name: rel.childProduct.name,
        price: rel.childProduct.basePrice,
        reason: rel.type === 'accessory' ? 'Perfect accessory for your item' : 'Frequently bought together',
        confidence: rel.confidenceScore
    }));

    return suggestions;
};

/**
 * Check Competitor Prices
 * Checks if any quoted items are priced significantly higher than market competitors.
 */
export const checkCompetitorPrices = async (quoteLines) => {
    const alerts = [];

    for (const line of quoteLines) {
        if (!line.partNumber) continue;

        const competitorMatch = await CompetitorProduct.findOne({
            where: { sku: line.partNumber },
            order: [['lastCheckedAt', 'DESC']]
        });

        if (competitorMatch) {
            const myPrice = parseFloat(line.unitSellExVat) || parseFloat(line.buyPrice * (1 + (line.markup || 0.25))); // Failsafe
            const marketPrice = parseFloat(competitorMatch.price);

            if (myPrice > marketPrice * 1.1) {
                const diffPercent = Math.round(((myPrice - marketPrice) / marketPrice) * 100);
                alerts.push({
                    lineId: line.id,
                    partNumber: line.partNumber,
                    alertType: 'High Price Warning',
                    message: `Price is ${diffPercent}% higher than ${competitorMatch.competitorName}`,
                    competitor: competitorMatch
                });
            }
        }
    }

    return alerts;
};

export default {
    calculateWinProbability,
    getSmartBundles,
    checkCompetitorPrices
};
