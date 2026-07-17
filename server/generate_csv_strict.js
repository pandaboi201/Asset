const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('D:/Asset/resourses/laptops_all.json', 'utf8'));
  const devices = new Map();

  // Fetch allowed brands and models from DB
  const settingsRecords = await prisma.systemSetting.findMany();
  let allowedBrands = [];
  let allowedModels = [];
  for (const s of settingsRecords) {
    if (s.key === 'manufacturer_options') {
      try { allowedBrands = JSON.parse(s.value); } catch(e){}
    }
    if (s.key === 'model_options') {
      try { allowedModels = JSON.parse(s.value); } catch(e){}
    }
  }

  // Create sets for case-sensitive strict matching
  const brandSet = new Set(allowedBrands);
  const modelSet = new Set(allowedModels);

  let skippedCount = 0;

  for (const row of data) {
    const sn = row['Laptop S/N'];
    if (!sn || typeof sn !== 'string') continue;
    const cleanSn = sn.trim();
    if (cleanSn.toLowerCase() === 'n/a' || cleanSn.toLowerCase() === 'none' || cleanSn === '') continue;

    if (!devices.has(cleanSn)) {
      devices.set(cleanSn, {
        makeModel: row['Make and Model'] || 'Unknown Laptop',
        chargerSn: row['Charger S/N'] || '',
        issueDate: row['Issue Date'] || '',
      });
    }
  }

  const csvRows = [
    'name,assetTag,category,manufacturer,model,serialNumber,status,condition,location,department,supplier,purchaseDate,warrantyExpiry,notes'
  ];

  for (const [sn, info] of devices.entries()) {
    const makeModel = info.makeModel.trim();
    const parts = makeModel.split(' ');
    const manufacturer = parts[0] || 'Unknown';
    const model = parts.slice(1).join(' ') || makeModel;
    
    // Strict Case-Sensitive Filtering Check
    if (!brandSet.has(manufacturer) || !modelSet.has(model)) {
      skippedCount++;
      continue;
    }

    const name = makeModel;
    const assetTag = sn; 
    
    // Handle newlines or quotes in notes/charger string
    let chargerNote = `Charger S/N: ${info.chargerSn}`;
    chargerNote = chargerNote.replace(/"/g, '""');

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
      `""`, 
      `""`, 
      `"${chargerNote}"`
    ].join(','));
  }

  fs.writeFileSync('D:/Asset/resourses/Laptops_Bulk_Import_Final.csv', csvRows.join('\n'));
  console.log('Generated ' + (devices.size - skippedCount) + ' unique laptops.');
  console.log('Skipped ' + skippedCount + ' laptops due to unrecognised Brand or Model.');
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
