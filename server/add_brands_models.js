const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('D:/Asset/resourses/laptops_all.json', 'utf8'));
  const brands = new Set();
  const models = new Set();

  for (const row of data) {
    const makeModel = (row['Make and Model'] || '').trim();
    if (!makeModel) continue;
    
    const parts = makeModel.split(' ');
    const manufacturer = parts[0] || 'Unknown';
    const model = parts.slice(1).join(' ') || makeModel;
    
    brands.add(manufacturer);
    models.add(model);
  }

  // Fetch current settings
  let mOptions = [];
  let modOptions = [];
  
  const mRecord = await prisma.systemSetting.findUnique({ where: { key: 'manufacturer_options' } });
  if (mRecord) {
    try { mOptions = JSON.parse(mRecord.value); } catch(e){}
  }
  
  const modRecord = await prisma.systemSetting.findUnique({ where: { key: 'model_options' } });
  if (modRecord) {
    try { modOptions = JSON.parse(modRecord.value); } catch(e){}
  }

  // Merge and deduplicate
  const finalBrands = [...new Set([...mOptions, ...brands])];
  const finalModels = [...new Set([...modOptions, ...models])];

  // Upsert back to database
  await prisma.systemSetting.upsert({
    where: { key: 'manufacturer_options' },
    update: { value: JSON.stringify(finalBrands) },
    create: { key: 'manufacturer_options', value: JSON.stringify(finalBrands) }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'model_options' },
    update: { value: JSON.stringify(finalModels) },
    create: { key: 'model_options', value: JSON.stringify(finalModels) }
  });

  console.log(`Added ${brands.size} brands and ${models.size} models to the system.`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
