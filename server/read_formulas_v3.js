import XLSX from 'xlsx';

const testFile = "C:/Projectes/Kastel Projects/Quote Desk/Costing sheet.xlsx";

try {
    const workbook = XLSX.readFile(testFile, { cellFormula: true });
    const ws = workbook.Sheets['Costing license '];

    console.log(`\n--- Formulas in Costing license (Line 1, Rows 8-11, Cols K-L) ---`);
    const targets = ['K8', 'L8', 'K9', 'L9'];

    targets.forEach(cellId => {
        const cell = ws[cellId];
        if (cell) {
            console.log(`${cellId}: ${cell.f || 'No formula'} (Value: ${cell.v})`);
        }
    });

    // Also check what cells they refer to
    // K8 likely refers to something like J8 / FX
    console.log(`\n--- Preceding columns ---`);
    ['J8', 'I8', 'H8', 'G8'].forEach(cellId => {
        const cell = ws[cellId];
        if (cell) {
            console.log(`${cellId}: ${cell.f || 'No formula'} (Value: ${cell.v})`);
        }
    });

} catch (error) {
    console.error('Error reading Excel formulas:', error);
}
