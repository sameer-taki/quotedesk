import XLSX from 'xlsx';

const testFile = "C:/Projectes/Kastel Projects/Quote Desk/Costing sheet.xlsx";

try {
    const workbook = XLSX.readFile(testFile);
    const ws = workbook.Sheets['Costing license '];

    console.log(`\n--- Row 8 Values in Costing license ---`);
    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'];

    cols.forEach(col => {
        const cell = ws[col + '8'];
        if (cell) {
            console.log(`${col}8: ${cell.v} (Type: ${typeof cell.v})`);
        }
    });

    console.log(`\n--- Global Values (Row 7) ---`);
    ['G7', 'I7', 'L7', 'P7'].forEach(col => {
        const cell = ws[col + '7'];
        if (cell) {
            console.log(`${col}7: ${cell.v}`);
        }
    });

} catch (error) {
    console.error('Error reading Excel:', error);
}
