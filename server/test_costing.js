import { parseSupplierExcel } from './src/services/excelService.js';
import { calculateLine } from './src/services/calculations.js';
import path from 'path';

const testFile = "C:/Projectes/Kastel Projects/Quote Desk/quoteforge-web/Kastel Technologies Ltd_SOFITEL FIJI RESORT AND SPA_C1300_Quote_24550646_en (1).xls";

async function test() {
    try {
        console.log('\n--- Verification with "Costing license" Row 8 ---');
        const row8 = {
            buyPrice: 263.58,
            exchangeRate: 0.72, // 1/0.72 = 1.3888
            freightRate: 0.05,
            dutyRate: 0,
            handlingRate: 0,
            targetMarkupPercent: 0.25,
            quantity: 1
        };

        const result = calculateLine(row8, 0.125);
        console.log(`Input Buy Price: ${row8.buyPrice}`);
        console.log(`Input FX: ${row8.exchangeRate} (Multiplier: ${1 / row8.exchangeRate})`);
        console.log(`  Unit Cost (FJD): ${result.unitCostFjd}`);
        console.log(`  Landed Cost: ${result.landedCost} (Expected: ~384.38)`);
        console.log(`  Sell Ex VAT: ${result.unitSellExVat} (Expected: ~480.48)`);
        console.log(`  Sell Inc VAT: ${result.unitSellIncVat} (Expected: ~540.54)`);

        console.log(`\nParsing file: ${testFile}`);
        const lines = await parseSupplierExcel(testFile);

        console.log(`\nFound ${lines.length} lines.`);

        if (lines.length > 0) {
            console.log('\n--- First 3 Lines Sample ---');
            lines.slice(0, 3).forEach((line, i) => {
                console.log(`\nLine ${i + 1}:`);
                console.log(`  Description: ${line.description}`);
                console.log(`  Part Number: ${line.partNumber}`);
                console.log(`  Quantity: ${line.quantity}`);
                console.log(`  Buy Price: ${line.buyPrice} ${line.currency}`);
                console.log(`  Parsed Rates: Ship=${line.freightRate}, Duty=${line.dutyRate}, FX=${line.exchangeRate}`);

                // Simulate FX lookup (normally done by the app)
                if (line.currency === 'NZD') line.exchangeRate = 1.39;
                if (line.currency === 'AUD') line.exchangeRate = 1.45;

                try {
                    // Test calculation
                    const result = calculateLine(line, 0.125);
                    console.log(`  Calculated:`);
                    console.log(`    Unit Cost (FJD): ${(line.buyPrice * (line.exchangeRate || 1)).toFixed(2)}`);
                    console.log(`    Landed Cost: ${result.landedCost}`);
                    console.log(`    Sell Ex VAT: ${result.unitSellExVat}`);
                    console.log(`    Line Total Inc VAT: ${result.lineTotalIncVat}`);
                } catch (lineError) {
                    console.error(`  Calculation Error: ${lineError.message}`);
                }
            });
        }
    } catch (error) {
        console.error('Error during test:', error);
    }
}

test();
