require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { XMLParser } = require('fast-xml-parser');
const parser = new XMLParser();
const crypto = require('crypto');

async function fetchIsapi(ip, user, pass, endpoint) {
  const url = 'http://' + ip + endpoint;
  let res = await fetch(url);
  if (res.status === 401) {
    const auth = res.headers.get('www-authenticate');
    if (auth && auth.includes('Digest')) {
      const parts = auth.substring(7).split(',').map(s => s.trim());
      const params = {};
      parts.forEach(p => {
        const eq = p.indexOf('=');
        if (eq > -1) params[p.substring(0, eq)] = p.substring(eq + 1).replace(/\"/g, '');
      });
      const cnonce = crypto.randomBytes(4).toString('hex');
      const nc = '00000001';
      const ha1 = crypto.createHash('md5').update(user + ':' + params.realm + ':' + pass).digest('hex');
      const ha2 = crypto.createHash('md5').update('GET:' + endpoint).digest('hex');
      const response = crypto.createHash('md5').update(ha1 + ':' + params.nonce + ':' + nc + ':' + cnonce + ':' + params.qop + ':' + ha2).digest('hex');
      const authHeader = `Digest username="${user}", realm="${params.realm}", nonce="${params.nonce}", uri="${endpoint}", qop=${params.qop}, nc=${nc}, cnonce="${cnonce}", response="${response}", opaque="${params.opaque}"`;
      res = await fetch(url, { headers: { 'Authorization': authHeader } });
    }
  }
  const text = await res.text();
  if (res.ok) return parser.parse(text);
  throw new Error(text);
}

const prisma = new PrismaClient();

async function run() {
  const nvr = await prisma.nvr.findFirst({ where: { ipAddress: '192.168.160.1' } });
  if (!nvr) return console.log('NVR not found');
  console.log('Found NVR', nvr.ipAddress);

  try {
    const info = await fetchIsapi(nvr.ipAddress, nvr.username, nvr.password, '/ISAPI/ContentMgmt/InputProxy/channels/1/deviceInfo');
    console.log(JSON.stringify(info, null, 2));
  } catch (e) {
    console.log('Error fetching proxied deviceInfo:', e.message);
  }
}
run().catch(console.error);
