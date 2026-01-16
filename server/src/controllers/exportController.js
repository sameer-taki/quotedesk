import PdfPrinter from 'pdfmake';
import * as XLSX from 'xlsx';
import { Quote, QuoteLine, User, Setting } from '../models/index.js';
import { asyncHandler } from '../middleware/validate.js';
import config from '../config/env.js';

// Font descriptors for pdfmake
const fonts = {
    Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

const printer = new PdfPrinter(fonts);

/**
 * Export quote to PDF
 * GET /api/quotes/:id/export/pdf
 */
export const exportPdf = asyncHandler(async (req, res) => {
    const quote = await Quote.findByPk(req.params.id, {
        include: [
            { model: User, as: 'creator', attributes: ['name', 'email'] },
            { model: QuoteLine, as: 'lines', order: [['lineNumber', 'ASC']] },
        ],
    });

    if (!quote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found',
        });
    }

    // Get settings for footer
    const vatRate = await Setting.getValue('vat_rate', config.app.vatRate);

    // Build PDF document
    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        defaultStyle: {
            font: 'Roboto'
        },

        header: (currentPage) => {
            if (currentPage === 1) return null;
            return {
                columns: [
                    { text: 'KASTEL TECHNOLOGIES', style: 'headerLeft' },
                    { text: `Page ${currentPage}`, style: 'headerRight' },
                ],
                margin: [40, 20, 40, 0]
            };
        },

        content: [
            // Company Header
            {
                columns: [
                    { text: 'KASTEL TECHNOLOGIES', style: 'companyName' },
                    { text: 'QUOTATION', style: 'documentTitle', alignment: 'right' },
                ],
                margin: [0, 0, 0, 20],
            },

            // Quote details
            {
                columns: [
                    {
                        width: '50%',
                        stack: [
                            { text: 'QUOTE TO:', style: 'sectionHeader' },
                            { text: quote.clientName, style: 'clientName' },
                        ],
                    },
                    {
                        width: '50%',
                        alignment: 'right',
                        stack: [
                            { text: `Quote #: ${quote.quoteNumber}`, style: 'quoteInfo' },
                            { text: `Date: ${formatDate(quote.quoteDate)}`, style: 'quoteInfo' },
                            { text: `Valid Until: ${formatDate(quote.validUntil)}`, style: 'quoteInfo' },
                        ],
                    },
                ],
                margin: [0, 0, 0, 30],
            },

            // Line items table
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 'auto', 'auto', 'auto'],
                    body: [
                        // Header
                        [
                            { text: '#', style: 'tableHeader' },
                            { text: 'Description', style: 'tableHeader' },
                            { text: 'Qty', style: 'tableHeader', alignment: 'center' },
                            { text: 'Unit Price', style: 'tableHeader', alignment: 'right' },
                            { text: 'Total', style: 'tableHeader', alignment: 'right' },
                        ],
                        // Data rows
                        ...quote.lines.map((line, idx) => [
                            { text: idx + 1, style: 'tableCell' },
                            { text: line.description, style: 'tableCell' },
                            { text: line.quantity.toString(), style: 'tableCell', alignment: 'center' },
                            { text: formatCurrency(line.unitSellExVat), style: 'tableCell', alignment: 'right' },
                            { text: formatCurrency(line.lineTotalExVat), style: 'tableCell', alignment: 'right' },
                        ]),
                    ],
                },
                layout: {
                    hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
                    vLineWidth: () => 0,
                    hLineColor: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? '#1a365d' : '#cccccc',
                    paddingTop: () => 8,
                    paddingBottom: () => 8,
                },
            },

            // Totals
            {
                margin: [0, 20, 0, 0],
                keepWithHeader: true,
                table: {
                    widths: ['*', 'auto', 'auto'],
                    body: [
                        ['', { text: 'Subtotal (Ex VAT):', style: 'totalLabel' }, { text: formatCurrency(quote.totalSellingExVat), style: 'totalValue' }],
                        ['', { text: `VAT (${(vatRate * 100).toFixed(1)}%):`, style: 'totalLabel' }, { text: formatCurrency(quote.totalVat), style: 'totalValue' }],
                        ['', { text: 'TOTAL (Inc VAT):', style: 'grandTotalLabel' }, { text: formatCurrency(quote.totalSellingIncVat), style: 'grandTotalValue' }],
                    ],
                },
                layout: 'noBorders',
            },

            // Footer notes
            {
                margin: [0, 40, 0, 0],
                unbreakable: true,
                stack: [
                    { text: 'Terms & Conditions:', style: 'footerHeader' },
                    { text: quote.footerNotes || getDefaultFooterNotes(), style: 'footerText' },
                ],
            },
        ],

        styles: {
            companyName: { fontSize: 16, bold: true, color: '#1a365d' },
            documentTitle: { fontSize: 22, bold: true, color: '#1a365d' },
            sectionHeader: { fontSize: 10, bold: true, color: '#666666', margin: [0, 0, 0, 5] },
            clientName: { fontSize: 14, bold: true, margin: [0, 0, 0, 10] },
            quoteInfo: { fontSize: 10, margin: [0, 2, 0, 0] },
            tableHeader: { fontSize: 10, bold: true, color: '#ffffff', fillColor: '#1a365d', margin: [5, 5, 5, 5] },
            tableCell: { fontSize: 10, margin: [5, 5, 5, 5] },
            totalLabel: { fontSize: 10, alignment: 'right', margin: [0, 5, 10, 5] },
            totalValue: { fontSize: 10, alignment: 'right', margin: [0, 5, 0, 5] },
            grandTotalLabel: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 10, 5], color: '#1a365d' },
            grandTotalValue: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 5], color: '#1a365d' },
            footerHeader: { fontSize: 10, bold: true, margin: [0, 0, 0, 10] },
            footerText: { fontSize: 9, color: '#444444', lineHeight: 1.4 },
            headerLeft: { fontSize: 10, bold: true, color: '#1a365d' },
            headerRight: { fontSize: 10, alignment: 'right', color: '#666666' },
        },
    };

    // Generate PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quote.quoteNumber}.pdf"`);

    pdfDoc.pipe(res);
    pdfDoc.end();
});

/**
 * Export quote to Excel
 * GET /api/quotes/:id/export/excel
 */
export const exportExcel = asyncHandler(async (req, res) => {
    const quote = await Quote.findByPk(req.params.id, {
        include: [
            { model: User, as: 'creator', attributes: ['name', 'email'] },
            { model: QuoteLine, as: 'lines', order: [['lineNumber', 'ASC']] },
        ],
    });

    if (!quote) {
        return res.status(404).json({
            success: false,
            message: 'Quote not found',
        });
    }

    const vatRate = await Setting.getValue('vat_rate', config.app.vatRate);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Quote details sheet
    const quoteData = [
        ['QUOTATION'],
        [],
        ['Quote Number:', quote.quoteNumber],
        ['Client:', quote.clientName],
        ['Date:', formatDate(quote.quoteDate)],
        ['Valid Until:', formatDate(quote.validUntil)],
        ['Status:', quote.status.toUpperCase()],
        [],
        ['LINE ITEMS'],
        ['#', 'Part Number', 'Description', 'Qty', 'Unit Price (Ex VAT)', 'Total (Ex VAT)', 'VAT', 'Total (Inc VAT)'],
        ...quote.lines.map((line, idx) => [
            idx + 1,
            line.partNumber || '',
            line.description,
            line.quantity,
            parseFloat(line.unitSellExVat),
            parseFloat(line.lineTotalExVat),
            parseFloat(line.vatAmount),
            parseFloat(line.lineTotalIncVat),
        ]),
        [],
        ['', '', '', '', 'Subtotal (Ex VAT):', parseFloat(quote.totalSellingExVat)],
        ['', '', '', '', `VAT (${(vatRate * 100).toFixed(1)}%):`, parseFloat(quote.totalVat)],
        ['', '', '', '', 'TOTAL (Inc VAT):', parseFloat(quote.totalSellingIncVat)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(quoteData);

    // Set column widths
    ws['!cols'] = [
        { wch: 5 },   // #
        { wch: 15 },  // Part Number
        { wch: 40 },  // Description
        { wch: 8 },   // Qty
        { wch: 18 },  // Unit Price
        { wch: 18 },  // Total Ex VAT
        { wch: 12 },  // VAT
        { wch: 18 },  // Total Inc VAT
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Quote');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${quote.quoteNumber}.xlsx"`);
    res.send(buffer);
});

// Helper functions (Hoisted automatically)
function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatCurrency(amount) {
    const val = parseFloat(amount) || 0;
    return `$${val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function getDefaultFooterNotes() {
    return `1. This quote is valid for the period specified above.
2. Prices are subject to exchange rate fluctuations.
3. Payment terms: 50% deposit, balance on delivery.
4. Delivery time to be confirmed upon order placement.
5. All prices include GST/VAT where applicable.`;
}

export default {
    exportPdf,
    exportExcel,
};
