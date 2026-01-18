import XLSX from 'xlsx';

const testFile = "C:/Projectes/Kastel Projects/Quote Desk/Costing sheet.xlsx";

try {
    const workbook = XLSX.readFile(testFile, { cellFormula: true });
    const ws = workbook.Sheets['Costing license '];

    console.log(`\n--- Formulas in Costing license (Line 1, Rows 8-11) ---`);
    const targets = ['M8', 'N8', 'O8', 'P8', 'Q8', 'M9', 'N9', 'O9', 'P9', 'Q9'];

    targets.forEach(cellId => {
        const cell = ws[cellId];
        if (cell) {
            console.log(`${cellId}: ${cell.f || 'No formula'} (Value: ${cell.v})`);
        }
    });

    // Also check the rates it might be using
    console.log(`\n--- Global Rate References ---`);
    const rateRefs = ['Main Sheet!B2', 'Main Sheet!B3', 'Main Sheet!B4', 'Main Sheet!B5', 'Main Sheet!B6'];
    // We can't easily check what cells use these without searching, 
    // but let's see if we find any references in the formulas we just printed.

} catch (error) {
    console.error('Error reading Excel formulas:', error);
}
