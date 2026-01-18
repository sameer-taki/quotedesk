/**
 * Quote Line Calculation Utilities
 * Matches server-side calculations exactly
 * 
 * Formulas from "QuoteForge Test 2.0.xlsx":
 * Unit Cost (FJD) = BuyPrice × FxRate
 * Ship Cost = Unit Cost (FJD) × ShipRate
 * Duty = (Unit Cost + Ship Cost) × DutyRate
 * Landed Cost = Unit Cost (FJD) + Ship Cost + Duty
 * Sell Ex VAT = Landed Cost / (1 - GM%)
 * Line Total = Sell Inc VAT × Quantity
 */

/**
 * Calculate all derived values for a quote line
 */
export const calculateLine = (line, vatRate = 0.125) => {
    const {
        buyPrice,
        freightRate = 0,
        exchangeRate,
        dutyRate = 0,
        quantity = 1,
        targetMarkupPercent = 0.25,
        overrideMarkupPercent = null,
    } = line;

    if (buyPrice === undefined || buyPrice === null || buyPrice < 0) {
        return null;
    }

    // If exchange rate is 0 or not set, treat as 1 (no conversion)
    const effectiveExchangeRate = (!exchangeRate || exchangeRate <= 0) ? 1 : exchangeRate;

    // Step 1: Convert to base currency (FJD)
    const unitCostFjd = buyPrice * effectiveExchangeRate;

    // Step 2: Calculate shipping (additive)
    const freightAmount = unitCostFjd * freightRate;

    // Step 3: Calculate duty on (unit + shipping)
    const dutyAmount = (unitCostFjd + freightAmount) * dutyRate;

    // Step 4: Landed Cost = Unit + Ship + Duty
    const landedCost = unitCostFjd + freightAmount + dutyAmount;

    // Determine margin percentage (this is gross margin, not markup)
    const marginPercent = overrideMarkupPercent !== null && overrideMarkupPercent !== undefined
        ? overrideMarkupPercent
        : targetMarkupPercent;

    // Step 5: Sell Ex VAT = Landed / (1 - GM%)
    // Prevent division by zero if margin is 100%
    const effectiveMargin = marginPercent >= 1 ? 0.99 : marginPercent;
    const unitSellExVat = landedCost / (1 - effectiveMargin);

    // Calculate markup amount for reporting
    const markupAmount = unitSellExVat - landedCost;

    // Step 6: Line totals
    const lineTotalExVat = unitSellExVat * quantity;

    // Step 7: VAT calculation
    const vatAmount = lineTotalExVat * vatRate;
    const lineTotalIncVat = lineTotalExVat + vatAmount;

    return {
        freightAmount: round(freightAmount, 4),
        dutyAmount: round(dutyAmount, 4),
        handlingAmount: 0, // Not used in new formula
        landedCost: round(landedCost, 4),
        markupPercent: round(marginPercent, 4),
        markupAmount: round(markupAmount, 4),
        unitSellExVat: round(unitSellExVat, 4),
        lineTotalExVat: round(lineTotalExVat, 2),
        vatAmount: round(vatAmount, 2),
        lineTotalIncVat: round(lineTotalIncVat, 2),
    };
};

/**
 * Calculate quote totals from lines
 */
export const calculateQuoteTotals = (lines) => {
    if (!lines || lines.length === 0) {
        return {
            totalLandedCost: 0,
            totalMarkup: 0,
            totalSellingExVat: 0,
            totalVat: 0,
            totalSellingIncVat: 0,
            overallGmPercent: 0,
            lineCount: 0,
        };
    }

    const totalLandedCost = lines.reduce((sum, line) =>
        sum + (line.landedCost * line.quantity), 0);

    const totalMarkup = lines.reduce((sum, line) =>
        sum + (line.markupAmount * line.quantity), 0);

    const totalSellingExVat = lines.reduce((sum, line) =>
        sum + line.lineTotalExVat, 0);

    const totalVat = lines.reduce((sum, line) =>
        sum + line.vatAmount, 0);

    const totalSellingIncVat = lines.reduce((sum, line) =>
        sum + line.lineTotalIncVat, 0);

    const overallGmPercent = totalSellingExVat > 0
        ? (totalSellingExVat - totalLandedCost) / totalSellingExVat
        : 0;

    return {
        totalLandedCost: round(totalLandedCost, 2),
        totalMarkup: round(totalMarkup, 2),
        totalSellingExVat: round(totalSellingExVat, 2),
        totalVat: round(totalVat, 2),
        totalSellingIncVat: round(totalSellingIncVat, 2),
        overallGmPercent: round(overallGmPercent, 4),
        lineCount: lines.length,
    };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount, currency = 'FJD') => {
    return new Intl.NumberFormat('en-FJ', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount || 0);
};

/**
 * Format percentage for display
 */
export const formatPercent = (value) => {
    return `${(value * 100).toFixed(2)}%`;
};

/**
 * Round number to specified decimal places
 */
const round = (value, decimals) => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export default {
    calculateLine,
    calculateQuoteTotals,
    formatCurrency,
    formatPercent,
};
