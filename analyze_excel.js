import XLSX from 'xlsx';

const file = 'QuoteForge Test 2.0.xlsx';
const wb = XLSX.readFile(file);

console.log('=== Sheet Names ===');
console.log(wb.SheetNames);

// Check each sheet
wb.SheetNames.forEach(sheetName => {
    console.log(`\n=== ${sheetName} ===`);
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Rows: ${data.length}`);

    // Print first 40 rows
    data.slice(0, 40).forEach((row, i) => {
        console.log(`Row ${i}: ${JSON.stringify(row)}`);
    });
});
