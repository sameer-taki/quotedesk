import XLSX from 'xlsx';

const testFile = "C:/Projectes/Kastel Projects/Quote Desk/Costing sheet.xlsx";

try {
    const workbook = XLSX.readFile(testFile);

    ['Supplier Quote', 'Quote'].forEach(name => {
        const ws = workbook.Sheets[name];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        console.log(`\n--- Sheet: ${name} (Rows 0-50) ---`);
        rows.slice(0, 51).forEach((row, i) => {
            if (row && row.length > 0) console.log(`Row ${i}:`, JSON.stringify(row));
        });
    });
} catch (error) {
    console.error('Error reading Excel:', error);
}
