const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const PORT = process.env.PORT || 5000;

// Initialize database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Simple MIME type detection
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Parse JSON body
const parseJsonBody = (req) => {
  return new Promise((resolve) => {
    if (req.method !== 'POST' && req.method !== 'PUT') {
      resolve({});
      return;
    }
    
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // API Routes
    if (pathname === '/api/customers' && req.method === 'GET') {
      const result = await pool.query('SELECT * FROM customers ORDER BY company_name');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows));
      return;
    }

    if (pathname.startsWith('/api/customers/') && req.method === 'GET') {
      const customerId = pathname.split('/')[3];
      const result = await pool.query('SELECT * FROM customers WHERE customer_id = $1', [customerId]);
      
      if (result.rows.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Customer not found' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows[0]));
      return;
    }

    if (pathname === '/api/customers' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const {
        customerId, companyName, status, affiliatePartner, nextStep,
        physicalAddress, billingAddress, primaryContact, authorizedSigner, billingContact, notes
      } = body;
      
      const result = await pool.query(
        `INSERT INTO customers (customer_id, company_name, status, affiliate_partner, next_step, 
         physical_address, billing_address, primary_contact, authorized_signer, billing_contact, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
        [customerId, companyName, status, affiliatePartner, nextStep, physicalAddress, billingAddress, 
         JSON.stringify(primaryContact), JSON.stringify(authorizedSigner), JSON.stringify(billingContact), JSON.stringify(notes)]
      );
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows[0]));
      return;
    }

    if (pathname.startsWith('/api/customers/') && req.method === 'PUT') {
      const customerId = pathname.split('/')[3];
      const body = await parseJsonBody(req);
      const {
        companyName, status, affiliatePartner, nextStep,
        physicalAddress, billingAddress, primaryContact, authorizedSigner, billingContact, notes
      } = body;
      
      const result = await pool.query(
        `UPDATE customers SET 
         company_name = $2, status = $3, affiliate_partner = $4, next_step = $5,
         physical_address = $6, billing_address = $7, primary_contact = $8, 
         authorized_signer = $9, billing_contact = $10, notes = $11, updated_at = NOW()
         WHERE customer_id = $1 RETURNING *`,
        [customerId, companyName, status, affiliatePartner, nextStep, physicalAddress, billingAddress,
         JSON.stringify(primaryContact), JSON.stringify(authorizedSigner), JSON.stringify(billingContact), JSON.stringify(notes)]
      );
      
      if (result.rows.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Customer not found' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.rows[0]));
      return;
    }

    if (pathname.startsWith('/api/customers/') && req.method === 'DELETE') {
      const customerId = pathname.split('/')[3];
      const result = await pool.query('DELETE FROM customers WHERE customer_id = $1 RETURNING *', [customerId]);
      
      if (result.rows.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Customer not found' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Customer deleted successfully' }));
      return;
    }

    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() }));
      return;
    }

    // Serve static files
    let filePath = pathname === '/' ? './index.html' : `.${pathname}`;
    
    // Security check
    if (filePath.includes('..')) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    try {
      const content = fs.readFileSync(filePath);
      const mimeType = getMimeType(filePath);
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content);
    } catch {
      // File not found, serve index.html for SPA routing
      try {
        const content = fs.readFileSync('./index.html');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not Found');
      }
    }

  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CRM Server running on port ${PORT}`);
  console.log('Database connected and ready');
});