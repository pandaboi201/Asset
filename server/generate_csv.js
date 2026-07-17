const fs = require('fs');
const data = JSON.parse(fs.readFileSync('D:/Asset/resourses/laptops.json', 'utf8'));
const devices = new Map();

for (const row of data) {
  const sn = row['Laptop S/N'];
  if (!sn || typeof sn !== 'string') continue;
  const cleanSn = sn.trim();
  if (!devices.has(cleanSn)) {
    devices.set(cleanSn, {
      makeModel: row['Make and Model'] || 'Unknown Laptop',
      chargerSn: row['Charger S/N'] || '',
    });
  }
}

const csvRows = [
  'name,assetTag,category,manufacturer,model,serialNumber,status,condition,location,department,supplier,notes'
];

let counter = 1;
for (const [sn, info] of devices.entries()) {
  const makeModel = info.makeModel.trim();
  const parts = makeModel.split(' ');
  const manufacturer = parts[0] || 'Unknown';
  const model = parts.slice(1).join(' ') || makeModel;
  const name = makeModel;
  const assetTag = sn; // using serial number as asset tag
  
  csvRows.push([
    `"${name}"`,
    `"${assetTag}"`,
    `"Laptop"`,
    `"${manufacturer}"`,
    `"${model}"`,
    `"${sn}"`,
    `"available"`,
    `"good"`,
    `"Main Office"`,
    `"IT Division"`,
    `"Unknown Supplier"`,
    `"Charger S/N: ${info.chargerSn}"`
  ].join(','));
  counter++;
}

fs.writeFileSync('D:/Asset/resourses/Laptops_Bulk_Import.csv', csvRows.join('\n'));
console.log('Generated ' + devices.size + ' unique laptops.');
