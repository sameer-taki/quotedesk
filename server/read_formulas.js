import XLSX from 'xlsx';

const testFile = "C:/Projectes/Kastel Projects/Quote Desk/Costing sheet.xlsx";

try {
    const workbook = XLSX.readFile(testFile, { cellFormula: true });

    ['Quote', 'Main Sheet'].forEach(name => {
        const ws = workbook.Sheets[name];
        console.log(`\n--- Formulas in Sheet: ${name} ---`);

        // Find cells with formulas
        for (let cellId in ws) {
            if (cellId[0] === '!') continue;
            const cell = ws[cellId];
            if (cell.f) {
                console.log(`${cellId}: ${cell.f} (Value: ${cell.v})`);
                // Only show a few to avoid flooding
                if (cellId.startsWith('B') || cellId.startsWith('D')) {
                    // continue
                }
            }
        }
    });
} catch (error) {
    console.error('Error reading Excel formulas:', error);
}
