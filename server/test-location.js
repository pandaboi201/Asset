const http = require('http');

const putData = JSON.stringify({
  location: "Server Room B - " + Date.now()
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/nvr/1', // Need actual NVR ID here
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
