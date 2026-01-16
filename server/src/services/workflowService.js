import { Quote, QuoteLine, Supplier, Product } from '../models/index.js';

/**
 * Generate Vendor Purchase Orders (Drafts)
 * Groups quote lines by supplier and prepares PO data.
 * Triggered typically when a Quote is 'Won' (Accepted).
 */
export const generateVendorPO = async (quoteId) => {
    const quote = await Quote.findByPk(quoteId, {
        include: [
            {
                model: QuoteLine,
                as: 'lines',
                include: [{ model: Supplier, as: 'supplier' }]
            }
        ]
    });

    if (!quote) throw new Error('Quote not found');

    const poList = [];
    const linesBySupplier = {};

    // Group lines
    for (const line of quote.lines) {
        // If no supplier, we can't make a PO. Move to 'Unassigned' or skip?
        const supplierId = line.supplierId || 'unknown';
        const supplierName = line.supplier ? line.supplier.name : 'Unknown Supplier';

        if (!linesBySupplier[supplierId]) {
            linesBySupplier[supplierId] = {
                supplierName,
                supplierId: line.supplierId,
                lines: [],
                totalCost: 0,
                currency: line.currency
            };
        }

        linesBySupplier[supplierId].lines.push({
            partNumber: line.partNumber,
            description: line.description,
            quantity: line.quantity,
            unitCost: line.buyPrice,
            totalCost: line.buyPrice * line.quantity
        });

        linesBySupplier[supplierId].totalCost += (line.buyPrice * line.quantity);
    }

    // Create PO Objects (In memory or DB)
    // For now, returning structured data for the frontend/process
    for (const [id, data] of Object.entries(linesBySupplier)) {
        if (id === 'unknown') continue; // Skip items without suppliers

        poList.push({
            type: 'Draft PO',
            supplier: data.supplierName,
            supplierId: maxLen(id, 36), // Safety check
            reference: `PO-${quote.quoteNumber}-${data.supplierName.substring(0, 3).toUpperCase()}`,
            items: data.lines,
            totalCost: data.totalCost,
            currency: data.currency,
            status: 'Draft',
            generatedAt: new Date()
        });
    }

    return poList;
};

const maxLen = (str, len) => str ? str.substring(0, len) : null;

export default {
    generateVendorPO
};
