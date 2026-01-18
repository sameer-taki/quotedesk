const XLSX = require('xlsx');
const fs = require('fs');

const file = '../QuoteForge Test 2.0.xlsx';
const wb = XLSX.readFile(file);

let output = '';
output += 'Sheet Names: ' + JSON.stringify(wb.SheetNames) + '\n\n';

wb.SheetNames.forEach(name => {
    const sheet = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    output += '=== ' + name + ' ===\n';
    output += 'Total Rows: ' + data.length + '\n';
    data.slice(0, 50).forEach((row, i) => {
        output += i + ': ' + JSON.stringify(row) + '\n';
    });
    output += '\n';
});

fs.writeFileSync('excel_output.txt', output);
console.log('Output written to excel_output.txt');
