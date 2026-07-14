require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.nvr.findFirst().then(n => {
  console.log(n);
  
  if (n) {
    const http = require('http');
    const putData = JSON.stringify({
      location: "Server Room B - " + Date.now()
    });

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/nvr/' + n.id,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(putData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => console.log('Response:', data));
    });

    req.write(putData);
    req.end();
  }
}).finally(() => p.$disconnect());
