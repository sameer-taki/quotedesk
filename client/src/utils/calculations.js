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
    // We treat exchangeRate as "Foreign per 1 FJD" (e.g. 0.45 USD/FJD)
    const divisor = (!exchangeRate || exchangeRate <= 0) ? 1 : exchangeRate;

    // 1. Unit Cost (FJD)
    const unitCostFjd = buyPrice * (1 / divisor);

    // 2. Multiplicative Landed Cost
    const landedCost = unitCostFjd *
        (1 + (freightRate || 0)) *
        (1 + (dutyRate || 0)) *
        (1 + (line.handlingRate || 0)); // Note: handlingRate is sometimes on the line

    // 3. Markup-based Selling Price
    const markupPercent = overrideMarkupPercent !== null && overrideMarkupPercent !== undefined
        ? overrideMarkupPercent
        : (targetMarkupPercent || 0);

    const unitSellExVat = landedCost * (1 + markupPercent);

    // 4. VAT and Totals
    const unitVat = unitSellExVat * vatRate;
    const unitSellIncVat = unitSellExVat + unitVat;

    const lineTotalExVat = unitSellExVat * quantity;
    const lineTotalVat = unitVat * quantity;
    const lineTotalIncVat = unitSellIncVat * quantity;
    const totalLandedCost = landedCost * quantity;

    // Gross Margin % (for reporting)
    const marginAmount = unitSellExVat - landedCost;
    const gmPercent = unitSellExVat > 0 ? marginAmount / unitSellExVat : 0;

    // Derived amounts for UI
    const freightAmount = unitCostFjd * (freightRate || 0);
    const dutyAmount = (unitCostFjd * (1 + (freightRate || 0))) * (dutyRate || 0);
    const handlingAmount = (unitCostFjd * (1 + (freightRate || 0)) * (1 + (dutyRate || 0))) * (line.handlingRate || 0);
    const markupAmount = unitSellExVat - landedCost;

    return {
        unitCostFjd: round(unitCostFjd, 4),
        landedCost: round(landedCost, 4),
        unitSellExVat: round(unitSellExVat, 4),
        unitVat: round(unitVat, 4),
        unitSellIncVat: round(unitSellIncVat, 4),
        lineTotalExVat: round(lineTotalExVat, 2),
        vatAmount: round(lineTotalVat, 2), // Legacy alias
        lineTotalVat: round(lineTotalVat, 2),
        lineTotalIncVat: round(lineTotalIncVat, 2),
        totalLandedCost: round(totalLandedCost, 4),
        gmPercent: round(gmPercent, 4),
        freightAmount: round(freightAmount, 4),
        dutyAmount: round(dutyAmount, 4),
        handlingAmount: round(handlingAmount, 4),
        markupPercent: round(markupPercent, 4),
        markupAmount: round(markupAmount, 4),
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
        sum + (line.landedCost * (line.quantity || 1)), 0);

    const totalMarkupAmount = lines.reduce((sum, line) =>
        sum + (line.markupAmount * (line.quantity || 1)), 0);

    const totalSellingExVat = lines.reduce((sum, line) =>
        sum + (line.lineTotalExVat || 0), 0);

    const totalVat = lines.reduce((sum, line) =>
        sum + (line.lineTotalVat || line.vatAmount || 0), 0);

    const totalSellingIncVat = lines.reduce((sum, line) =>
        sum + (line.lineTotalIncVat || 0), 0);

    const overallGmPercent = totalSellingExVat > 0
        ? (totalSellingExVat - totalLandedCost) / totalSellingExVat
        : 0;

    return {
        totalLandedCost: round(totalLandedCost, 2),
        totalMarkup: round(totalMarkupAmount, 2),
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
