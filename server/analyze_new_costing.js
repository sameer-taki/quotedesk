import XLSX from 'xlsx';

const testFile = "C:/Projectes/Kastel Projects/Quote Desk/Costing sheet.xlsx";

try {
    const workbook = XLSX.readFile(testFile);
    const licenseSheet = workbook.Sheets['Costing license '];
    console.log(`\n--- Formulas in Sheet: Costing license ---`);

    // Find cells with formulas in columns Q and nearby
    for (let cellId in licenseSheet) {
        if (cellId[0] === '!') continue;
        const cell = licenseSheet[cellId];
        if (cell.f && (cellId.startsWith('Q') || cellId.startsWith('P') || cellId.startsWith('M') || cellId.startsWith('L'))) {
            console.log(`${cellId}: ${cell.f} (Value: ${cell.v})`);
        }
    }
} catch (error) {
    console.error('Error reading Excel:', error);
}
