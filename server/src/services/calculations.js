/**
 * Quote Calculation Service
 * 
 * Implements the exact formulas from "Costing sheet.xlsx":
 * 
 * Landed Cost = BuyPrice × (1 + FreightRate) × (1/FxRate) × (1 + DutyRate) × (1 + HandlingRate)
 * Markup Amount = LandedCost × MarkupPercent
 * Unit Sell Ex VAT = LandedCost + MarkupAmount
 * Line Total Ex VAT = UnitSellExVat × Quantity
 * VAT Amount = LineTotalExVat × VATRate
 * Line Total Inc VAT = LineTotalExVat + VATAmount
 */

/**
 * Calculate all derived values for a quote line
 * @param {Object} line - Line item data
 * @param {number} line.buyPrice - Unit cost in supplier currency
 * @param {number} line.freightRate - Freight rate as decimal (e.g., 0.05 for 5%)
 * @param {number} line.exchangeRate - FX rate (supplier currency to base, e.g., 0.72 for NZD)
 * @param {number} line.dutyRate - Duty rate as decimal
 * @param {number} line.handlingRate - Handling rate as decimal
 * @param {number} line.quantity - Quantity
 * @param {number} line.targetMarkupPercent - Target markup from category
 * @param {number|null} line.overrideMarkupPercent - Override markup if set
 * @param {number} vatRate - VAT rate as decimal (e.g., 0.125 for 12.5%)
 * @returns {Object} Calculated values
 */
export const calculateLine = (line, vatRate = 0.125) => {
    const {
        buyPrice,
        freightRate = 0,
        exchangeRate,
        dutyRate = 0,
        handlingRate = 0,
        quantity = 1,
        targetMarkupPercent = 0.25,
        overrideMarkupPercent = null,
    } = line;

    // Validate inputs
    if (!buyPrice || buyPrice < 0) {
        throw new Error('Buy price must be a positive number');
    }
    if (!exchangeRate || exchangeRate <= 0) {
        throw new Error('Exchange rate must be a positive number');
    }
    if (quantity < 1) {
        throw new Error('Quantity must be at least 1');
    }

    // Calculate intermediate values
    const freightMultiplier = 1 + freightRate;
    const fxMultiplier = exchangeRate; // Already Base per FX (FJD per Currency)
    const dutyMultiplier = 1 + dutyRate;
    const handlingMultiplier = 1 + handlingRate;

    // Freight amount (for reporting)
    const freightAmount = buyPrice * freightRate;

    // Landed Cost = BuyPrice × (1+Freight) × (1/FxRate) × (1+Duty) × (1+Handling)
    const landedCost = buyPrice * freightMultiplier * fxMultiplier * dutyMultiplier * handlingMultiplier;

    // Duty amount (for reporting)
    const dutyAmount = buyPrice * fxMultiplier * dutyRate;

    // Handling amount (for reporting)
    const handlingAmount = buyPrice * fxMultiplier * handlingRate;

    // Determine markup percentage
    const markupPercent = overrideMarkupPercent !== null && overrideMarkupPercent !== undefined
        ? overrideMarkupPercent
        : targetMarkupPercent;

    // Markup Amount = LandedCost × MarkupPercent
    const markupAmount = landedCost * markupPercent;

    // Unit Sell Ex VAT = LandedCost + MarkupAmount
    const unitSellExVat = landedCost + markupAmount;

    // Line Total Ex VAT = UnitSellExVat × Quantity
    const lineTotalExVat = unitSellExVat * quantity;

    // VAT Amount = LineTotalExVat × VATRate
    const vatAmount = lineTotalExVat * vatRate;

    // Line Total Inc VAT = LineTotalExVat + VATAmount
    const lineTotalIncVat = lineTotalExVat + vatAmount;

    return {
        freightAmount: round(freightAmount, 4),
        dutyAmount: round(dutyAmount, 4),
        handlingAmount: round(handlingAmount, 4),
        landedCost: round(landedCost, 4),
        markupPercent: round(markupPercent, 4),
        markupAmount: round(markupAmount, 4),
        unitSellExVat: round(unitSellExVat, 4),
        lineTotalExVat: round(lineTotalExVat, 2),
        vatAmount: round(vatAmount, 2),
        lineTotalIncVat: round(lineTotalIncVat, 2),
    };
};

/**
 * Calculate quote totals from lines
 * @param {Array} lines - Array of calculated line items
 * @returns {Object} Quote totals
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

    // Overall GM% = (Total Selling Ex VAT - Total Landed) / Total Selling Ex VAT
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
 * Check if quote needs approval based on GM thresholds
 * @param {number} overallGmPercent - Overall gross margin percentage
 * @param {Object} thresholds - GM thresholds
 * @returns {Object} Approval flags
 */
export const checkApprovalRequired = (overallGmPercent, thresholds = {}) => {
    const {
        lowGmThreshold = 0.08,     // 8% - low margin warning
        criticalGmThreshold = 0.05 // 5% - critical margin warning
    } = thresholds;

    return {
        requiresApproval: overallGmPercent < lowGmThreshold,
        isLowMargin: overallGmPercent < lowGmThreshold && overallGmPercent >= criticalGmThreshold,
        isCriticalMargin: overallGmPercent < criticalGmThreshold,
        gmPercent: round(overallGmPercent * 100, 2),
        message: overallGmPercent < criticalGmThreshold
            ? `Critical: GM is ${round(overallGmPercent * 100, 2)}% (below ${criticalGmThreshold * 100}%)`
            : overallGmPercent < lowGmThreshold
                ? `Warning: GM is ${round(overallGmPercent * 100, 2)}% (below ${lowGmThreshold * 100}%)`
                : null,
    };
};

/**
 * Round number to specified decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded value
 */
const round = (value, decimals) => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export default {
    calculateLine,
    calculateQuoteTotals,
    checkApprovalRequired,
};
