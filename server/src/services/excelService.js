import XLSX from 'xlsx';

/**
 * Excel Service for parsing supplier quotes
 */
export const parseSupplierExcel = async (filePath) => {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!data || data.length === 0) {
        throw new Error('Excel file is empty');
    }

    // Common column name mappings - ordered by preference
    const mappings = {
        description: ['description', 'material description', 'product name', 'item description', 'material'],
        partNumber: ['sku', 'part number', 'mfr part #', 'manufacturer part number', 'material', 'item number'],
        quantity: ['qty', 'quantity', 'units', 'item qty', 'count'],
        buyPrice: ['unit price', 'buy price', 'unit cost', 'cost', 'price', 'list price'],
    };

    let headerRowIndex = -1;
    let columnMap = {};
    let detectedCurrency = 'NZD'; // Fallback

    // 1. Scan for global fields (like Currency) and the Header Row
    for (let i = 0; i < Math.min(data.length, 100); i++) {
        const row = data[i];
        if (!row || !Array.isArray(row)) continue;

        // Check for "Currency" in this row
        for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            if (typeof cell === 'string') {
                const lowerCell = cell.toLowerCase().trim();
                // Match "currency", "quote currency", "document currency" etc.
                if (lowerCell.includes('currency')) {
                    // Search this row and the next row for a 3-letter code
                    const searchArea = [...row, ...(data[i + 1] || [])];
                    for (const potential of searchArea) {
                        if (typeof potential === 'string') {
                            const match = potential.trim().toUpperCase().match(/^[A-Z]{3}$/);
                            if (match && match[0] !== 'FJD') { // Prioritize foreign currencies if found
                                detectedCurrency = match[0];
                            }
                        }
                    }
                }
            }
        }

        // Try to identify as header row
        if (headerRowIndex === -1) {
            let matches = 0;
            const tempMap = {};

            row.forEach((cell, cellIndex) => {
                if (typeof cell !== 'string') return;
                const normalizedCell = cell.toLowerCase().trim();

                for (const [key, aliases] of Object.entries(mappings)) {
                    const aliasIndex = aliases.indexOf(normalizedCell);
                    if (aliasIndex !== -1) {
                        if (!tempMap[key] || aliasIndex < tempMap[key].priority) {
                            tempMap[key] = { index: cellIndex, priority: aliasIndex };
                            matches++;
                        }
                    }
                }
            });

            if (matches >= 2 && (tempMap.description !== undefined || tempMap.partNumber !== undefined)) {
                headerRowIndex = i;
                for (const key in tempMap) {
                    columnMap[key] = tempMap[key].index;
                }
            }
        }
    }

    if (headerRowIndex === -1) {
        throw new Error('Could not identify header row in Excel file');
    }

    const lines = [];
    // 2. Extract data rows
    for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const description = columnMap.description !== undefined ? row[columnMap.description] : null;
        const partNumber = columnMap.partNumber !== undefined ? row[columnMap.partNumber] : null;

        // Skip rows that don't have enough data
        if (!description && !partNumber) continue;

        // Skip if it looks like a section header or empty line
        if (description && (description.toString().trim().length < 2) && !partNumber) continue;

        // Skip if it looks like a total/summary row
        const descStr = (description || '').toString().toLowerCase();
        const partStr = (partNumber || '').toString().toLowerCase();

        const isSummary = (str) => {
            const lower = str.toLowerCase().trim();
            return lower.includes('total') ||
                lower.includes('subtotal') ||
                lower.includes('gst') ||
                lower.includes('vat') ||
                lower.includes('terms') ||
                lower.includes('note') ||
                lower === 'tax';
        };

        if (isSummary(descStr) || isSummary(partStr)) {
            // If we hit "total" and already have lines, we are likely at the bottom
            if (lines.length > 0 && (descStr.includes('total') || descStr.includes('terms') || descStr.includes('note'))) break;
            continue;
        }

        let quantity = columnMap.quantity !== undefined ? parseFloat(row[columnMap.quantity]) : 1;
        let buyPrice = columnMap.buyPrice !== undefined ? row[columnMap.buyPrice] : 0;

        // Clean up price (might have currency symbol or be a string)
        if (typeof buyPrice === 'string') {
            // Remove everything except numbers and decimal point
            buyPrice = parseFloat(buyPrice.replace(/[^0-9.]/g, ''));
        }

        // Final sanity check
        if (isNaN(quantity)) quantity = 1;
        if (isNaN(buyPrice)) buyPrice = 0;

        // If price is zero and description is short, it's likely noise
        if (buyPrice === 0 && (!description || description.toString().trim().length < 5)) continue;

        lines.push({
            description: description ? description.toString().trim() : (partNumber ? partNumber.toString().trim() : ''),
            partNumber: partNumber ? partNumber.toString().trim() : '',
            quantity,
            buyPrice,
            currency: detectedCurrency,
            freightRate: 0,
            dutyRate: 0,
            handlingRate: 0,
            targetMarkupPercent: 0.25
        });
    }

    return lines;
};

export default {
    parseSupplierExcel
};
