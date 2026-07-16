const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.post('/api/settings', async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      if (Array.isArray(value)) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: JSON.stringify(value) },
          create: { key, value: JSON.stringify(value) },
        });
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = app.listen(3002, async () => {
  try {
    const response = await fetch('http://localhost:3002/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department_options: ["IT Division", "Engineering", "Finance", "Human Resources", "Sales", "Marketing", "Security", "Facilities", "Support", "Legal", "IT Division", "SLO Division", "Finance Division", "Marketing Division", "Registrar's Office", "Software Division", "Computer Science Department", "Management Department", "Psychology Department", "President's Office"]
      })
    });
    console.log("Status:", response.status);
    console.log("Body:", await response.json());
  } catch (e) {
    console.error("Fetch error:", e);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
});
