const xlsx = require('xlsx');
const path = require('path');

try {
  const filePath = path.join('d:', 'Asset', 'resourses', 'Sample.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  // Print first 5 rows
  console.log("=== HEADERS ===");
  console.log(JSON.stringify(data[0]));
  console.log("=== DATA ROWS ===");
  for (let i = 1; i < Math.min(6, data.length); i++) {
    console.log(JSON.stringify(data[i]));
  }
} catch (e) {
  console.error(e);
}
