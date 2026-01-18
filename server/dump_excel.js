import XLSX from 'xlsx';

const testFile = "C:/Projectes/Kastel Projects/Quote Desk/quoteforge-web/Kastel Technologies Ltd_SOFITEL FIJI RESORT AND SPA_C1300_Quote_24550646_en (1).xls";

try {
    const workbook = XLSX.readFile(testFile);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('--- Raw Excel Data (Rows 20-25) ---');
    data.slice(20, 26).forEach((row, i) => {
        console.log(`Row ${20 + i}:`, JSON.stringify(row));
    });
} catch (error) {
    console.error('Error reading Excel:', error);
}
