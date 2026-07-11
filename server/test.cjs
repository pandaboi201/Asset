const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.asset.create({
      data: {
        name: 'test',
        assetTag: 'T1',
        category: 'Laptop',
        manufacturer: 'Apple',
        model: 'M2',
        serialNumber: 'SN1',
        status: 'available',
        condition: 'new',
        location: 'HQ',
        department: 'IT',
        supplier: 'CDW',
        notes: '',
        id: 'a1',
        purchaseDate: new Date().toISOString(),
        warrantyExpiry: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedTo: null
      }
    });
    console.log("Success");
  } catch (e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
