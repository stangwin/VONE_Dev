const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { IncomingForm } = require('formidable');
const crypto = require('crypto');
const { AuthService } = require('./server/auth');
const { createSessionMiddleware, requireAuth, isAuthenticated } = require('./server/middleware');

const PORT = process.env.PORT || 5000;

// Initialize database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize auth service
const authService = new AuthService(pool);

// Initialize session middleware
const sessionMiddleware = createSessionMiddleware(pool);

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

// Session middleware wrapper for HTTP server
function handleWithSession(req, res, handler) {
  sessionMiddleware(req, res, () => {
    handler(req, res);
  });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Wrap all requests with session handling
  return handleWithSession(req, res, async (req, res) => {
    
    // Debug logging for notes requests
    if (pathname.includes('notes')) {
      console.log('=== NOTES REQUEST INTERCEPTED ===');
      console.log('Method:', req.method);
      console.log('Pathname:', pathname);
      console.log('Full URL:', req.url);
      console.log('Session exists:', !!req.session);
      console.log('User ID:', req.session?.userId);
    }

    try {
      // Authentication Routes
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const { email, password } = await parseJsonBody(req);
        
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Email and password are required' }));
          return;
        }

        const user = await authService.authenticateUser(email, password);
        
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid email or password' }));
          return;
        }

        req.session.userId = user.id;
        req.session.user = user;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ user }));
        return;
      }

      if (pathname === '/api/auth/logout' && req.method === 'POST') {
        req.session.destroy((err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to logout' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Logged out successfully' }));
        });
        return;
      }

      if (pathname === '/api/auth/me' && req.method === 'GET') {
        if (!req.session || !req.session.userId) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not authenticated' }));
          return;
        }

        const user = await authService.getUserById(req.session.userId);
        
        if (!user) {
          req.session.destroy();
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }

        const userWithStatus = {
          ...user,
          twoFactorEnabled: !!user.two_factor_enabled
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ user: userWithStatus }));
        return;
      }

      if (pathname === '/api/auth/register' && req.method === 'POST') {
        const { name, email, password } = await parseJsonBody(req);
        
        if (!name || !email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Name, email, and password are required' }));
          return;
        }

        // Check if user already exists
        const existingUser = await authService.getUserByEmail(email);
        if (existingUser) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User with this email already exists' }));
          return;
        }

        try {
          const user = await authService.createUser({ name, email, password });
          req.session.userId = user.id;
          req.session.user = user;
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ user }));
        } catch (error) {
          console.error('Registration error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to create user' }));
        }
        return;
      }

      // User Management Routes
      if (pathname === '/api/users' && req.method === 'GET') {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }

        const currentUser = await authService.getUserById(req.session.userId);
        if (!currentUser || currentUser.role !== 'admin') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }

        const users = await authService.getAllUsers();
        const usersWithStatus = users.map(user => ({
          ...user,
          two_factor_enabled: !!user.two_factor_enabled
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(usersWithStatus));
        return;
      }

      if (pathname === '/api/users' && req.method === 'POST') {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }

        const currentUser = await authService.getUserById(req.session.userId);
        if (!currentUser || currentUser.role !== 'admin') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }

        const { name, email, password, role = 'user' } = await parseJsonBody(req);
        
        if (!name || !email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Name, email, and password are required' }));
          return;
        }

        try {
          const newUser = await authService.createUser({ name, email, password, role });
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newUser));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
        return;
      }

      if (pathname.match(/^\/api\/users\/\d+$/) && req.method === 'PUT') {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }

        const userId = parseInt(pathname.split('/')[3]);
        const currentUser = await authService.getUserById(req.session.userId);
        
        // Users can only edit their own profile unless they're admin
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== userId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Access denied' }));
          return;
        }

        const updates = await parseJsonBody(req);
        
        // Regular users can't change their role
        if (currentUser.role !== 'admin' && updates.role) {
          delete updates.role;
        }

        try {
          const updatedUser = await authService.updateUser(userId, updates);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updatedUser));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
        return;
      }

      if (pathname.match(/^\/api\/users\/\d+$/) && req.method === 'DELETE') {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }

        const userId = parseInt(pathname.split('/')[3]);
        const currentUser = await authService.getUserById(req.session.userId);
        
        if (!currentUser || currentUser.role !== 'admin') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }

        // Prevent self-deletion
        if (currentUser.id === userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Cannot delete your own account' }));
          return;
        }

        try {
          await authService.deleteUser(userId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'User deleted successfully' }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
        return;
      }

      if (pathname === '/api/user' && req.method === 'GET') {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }

        const user = await authService.getUserById(req.session.userId);
        if (!user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(user));
        return;
      }

      // Protected API Routes - Require authentication for all customer operations
      if (pathname === '/api/customers' && req.method === 'GET') {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }
        
        const result = await pool.query('SELECT * FROM customers ORDER BY company_name');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows));
        return;
      }

      // Get notes for customer (must come before general customer GET)
      if (req.method === 'GET' && pathname.match(/^\/api\/customers\/[^\/]+\/notes$/)) {
        console.log('=== NOTES GET REQUEST MATCHED ===');
        console.log('Notes GET request received for:', pathname);
        console.log('Request method:', req.method);
        console.log('Full URL:', req.url);
        
        if (!isAuthenticated(req)) {
          console.log('Notes request - user not authenticated');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }

        try {
          const customerId = pathname.split('/')[3];
          console.log('Fetching notes for customer:', customerId);
          console.log('User session info:', req.session?.userId, req.session?.user?.email);
          
          const result = await pool.query(
            'SELECT * FROM customer_notes WHERE customer_id = $1 ORDER BY timestamp DESC',
            [customerId]
          );

          console.log('Notes query completed. Found:', result.rows.length);
          if (result.rows.length > 0) {
            console.log('Sample note ID:', result.rows[0].id);
            console.log('Sample note content length:', result.rows[0].content?.length);
            console.log('Sample note preview:', result.rows[0].content?.substring(0, 50) + '...');
          }
          
          console.log('Sending notes response with status 200');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result.rows));
          return;
        } catch (error) {
          console.error('Error fetching notes:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch notes', details: error.message }));
          return;
        }
      }

      // Get files for customer (must come before general customer GET)
      if (req.method === 'GET' && pathname.match(/^\/api\/customers\/[^\/]+\/files$/)) {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }
        
        const customerId = pathname.split('/')[3];
        
        const query = 'SELECT * FROM customer_files WHERE customer_id = $1 ORDER BY upload_date DESC';
        const result = await pool.query(query, [customerId]);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows));
        return;
      }

      if (pathname.startsWith('/api/customers/') && req.method === 'GET') {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }
        
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
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }
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
        
        // Create system note for customer creation
        try {
          const user = await authService.getUserById(req.session.userId);
          await createSystemNote(customerId, `Customer record created by ${user.name}`, req.session.userId);
        } catch (noteError) {
          console.error('Failed to create system note:', noteError);
        }
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows[0]));
        return;
      }

      if (pathname.startsWith('/api/customers/') && req.method === 'PUT') {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }
        const customerId = pathname.split('/')[3];
        const body = await parseJsonBody(req);
        
        console.log('Update request for customer:', customerId);
        console.log('Request body:', body);
        
        // Get current customer data first
        const currentResult = await pool.query(
          'SELECT * FROM customers WHERE customer_id = $1',
          [customerId]
        );
        
        if (currentResult.rows.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Customer not found' }));
          return;
        }
        
        const currentCustomer = currentResult.rows[0];
        
        // Build update query dynamically to only update provided fields
        const updateFields = [];
        const updateValues = [customerId];
        let paramIndex = 2;
        
        // Only update fields that are explicitly provided
        if ('company_name' in body && body.company_name !== undefined) {
          if (!body.company_name || body.company_name.trim() === '') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Company name cannot be empty' }));
            return;
          }
          updateFields.push(`company_name = $${paramIndex}`);
          updateValues.push(body.company_name.trim());
          paramIndex++;
        }
        
        if ('status' in body && body.status !== undefined) {
          updateFields.push(`status = $${paramIndex}`);
          updateValues.push(body.status);
          paramIndex++;
        }
        
        if ('affiliate_partner' in body) {
          updateFields.push(`affiliate_partner = $${paramIndex}`);
          updateValues.push(body.affiliate_partner || null);
          paramIndex++;
        }
        
        if ('next_step' in body) {
          updateFields.push(`next_step = $${paramIndex}`);
          updateValues.push(body.next_step || null);
          paramIndex++;
        }
        
        if ('physical_address' in body) {
          updateFields.push(`physical_address = $${paramIndex}`);
          updateValues.push(body.physical_address || null);
          paramIndex++;
        }
        
        if ('billing_address' in body) {
          updateFields.push(`billing_address = $${paramIndex}`);
          updateValues.push(body.billing_address || null);
          paramIndex++;
        }
        
        if ('primary_contact' in body) {
          updateFields.push(`primary_contact = $${paramIndex}`);
          updateValues.push(JSON.stringify(body.primary_contact || null));
          paramIndex++;
        }
        
        if ('authorized_signer' in body) {
          updateFields.push(`authorized_signer = $${paramIndex}`);
          updateValues.push(JSON.stringify(body.authorized_signer || null));
          paramIndex++;
        }
        
        if ('billing_contact' in body) {
          updateFields.push(`billing_contact = $${paramIndex}`);
          updateValues.push(JSON.stringify(body.billing_contact || null));
          paramIndex++;
        }
        
        if ('notes' in body) {
          updateFields.push(`notes = $${paramIndex}`);
          updateValues.push(JSON.stringify(body.notes || []));
          paramIndex++;
        }
        
        // Always update the timestamp
        updateFields.push(`updated_at = NOW()`);
        
        if (updateFields.length === 1) {
          // Only timestamp update, nothing to change
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(currentCustomer));
          return;
        }
        
        const updateQuery = `UPDATE customers SET ${updateFields.join(', ')} WHERE customer_id = $1 RETURNING *`;
        
        console.log('Update query:', updateQuery);
        console.log('Update values:', updateValues);
        
        const result = await pool.query(updateQuery, updateValues);
        
        if (result.rows.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Customer not found' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows[0]));
        return;
      }

      // Delete file (must come before general customer DELETE)
      if (req.method === 'DELETE' && pathname.match(/^\/api\/customers\/[^\/]+\/files\/\d+$/)) {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }
        const pathParts = pathname.split('/');
        const customerId = pathParts[3];
        const fileId = pathParts[5];
        
        console.log('Deleting file:', fileId, 'for customer:', customerId);
        
        // Get file record
        const selectQuery = 'SELECT * FROM customer_files WHERE id = $1 AND customer_id = $2';
        const fileResult = await pool.query(selectQuery, [fileId, customerId]);
        
        if (fileResult.rows.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'File not found' }));
          return;
        }

        const file = fileResult.rows[0];
        
        // Delete physical file
        const filePath = `./public${file.file_url}`;
        try {
          fs.unlinkSync(filePath);
          console.log('Physical file deleted:', filePath);
        } catch (fsError) {
          console.warn('Could not delete physical file:', fsError.message);
        }

        // Delete database record
        const deleteQuery = 'DELETE FROM customer_files WHERE id = $1';
        await pool.query(deleteQuery, [fileId]);
        console.log('File record deleted from database');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'File deleted successfully' }));
        return;
      }

      // Customer deletion (exact path only, not file paths)
      if (pathname.match(/^\/api\/customers\/[^\/]+$/) && req.method === 'DELETE') {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }
        const customerId = pathname.split('/')[3];
        console.log('Deleting customer:', customerId);
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

      // File upload endpoint
      if (req.method === 'POST' && pathname.match(/^\/api\/customers\/[^\/]+\/files$/)) {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }
        const customerId = pathname.split('/')[3];
        
        const form = new IncomingForm({
          uploadDir: `./public/uploads/${customerId}`,
          keepExtensions: true,
          maxFileSize: 100 * 1024 * 1024, // 100MB per file for videos
          maxTotalFileSize: 200 * 1024 * 1024, // 200MB total to accommodate videos
          filter: ({ mimetype }) => {
            return mimetype && (
              mimetype.startsWith('image/') || 
              mimetype === 'application/pdf' ||
              mimetype.startsWith('video/')
            );
          }
        });

        // Ensure upload directory exists
        const uploadDir = `./public/uploads/${customerId}`;
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        form.parse(req, async (err, fields, files) => {
          if (err) {
            console.error('Form parse error:', err);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Upload failed: ' + err.message }));
            return;
          }

          console.log('Files received:', files);
          
          try {
            // Handle both single file and multiple files
            let fileArray = [];
            if (files.files) {
              fileArray = Array.isArray(files.files) ? files.files : [files.files];
            } else {
              // Check for individual file fields
              Object.keys(files).forEach(key => {
                if (Array.isArray(files[key])) {
                  fileArray.push(...files[key]);
                } else {
                  fileArray.push(files[key]);
                }
              });
            }

            console.log('Processing files:', fileArray.length);
            const fileRecords = [];

            for (const file of fileArray) {
              if (!file || !file.originalFilename) {
                console.log('Skipping invalid file:', file);
                continue;
              }

              console.log('Processing file:', file.originalFilename);

              // Generate unique filename
              const timestamp = Date.now();
              const randomSuffix = Math.round(Math.random() * 1E9);
              const ext = path.extname(file.originalFilename);
              const fileName = `${timestamp}-${randomSuffix}${ext}`;
              const newPath = path.join(uploadDir, fileName);

              // Move file to final location
              console.log('Moving file from', file.filepath, 'to', newPath);
              fs.renameSync(file.filepath, newPath);

              // Save to database
              console.log('Saving file metadata to database');
            const query = `
              INSERT INTO customer_files (customer_id, file_name, original_name, file_url, file_type, file_size)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING *
            `;
            const values = [
              customerId,
              fileName,
              file.originalFilename,
              `/uploads/${customerId}/${fileName}`,
              file.mimetype,
              file.size
            ];

            const result = await pool.query(query, values);
            console.log('File saved to database:', result.rows[0]);
            fileRecords.push(result.rows[0]);
          }

          console.log('Upload complete. Files processed:', fileRecords.length);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Files uploaded successfully', files: fileRecords }));
        } catch (error) {
          console.error('File upload error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to save file metadata' }));
        }
      });
      return;
    }





    // Customer Notes API Routes
    if (pathname.startsWith('/api/customers/') && pathname.endsWith('/notes') && req.method === 'POST') {
      console.log('Note creation request received for:', pathname);
      
      if (!isAuthenticated(req)) {
        console.log('Note creation failed: Not authenticated');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Authentication required' }));
        return;
      }

      const customerId = pathname.split('/')[3];
      console.log('Creating note for customer:', customerId);
      
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const noteData = JSON.parse(body);
          console.log('Note data received:', noteData);
          
          // Get the authenticated user
          const user = await authService.getUserById(req.session.userId);
          if (!user) {
            console.log('Note creation failed: User not found');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }

          console.log('Creating note with user:', user.name);
          
          const noteType = noteData.type || 'manual';
          const authorName = noteType === 'system' ? 'System' : user.name;
          
          const result = await pool.query(
            `INSERT INTO customer_notes (customer_id, author_id, author_name, content, type, timestamp, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
             RETURNING *`,
            [customerId, user.id, authorName, noteData.content, noteType]
          );

          console.log('Note created successfully:', result.rows[0]);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result.rows[0]));
        } catch (error) {
          console.error('Error creating note:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to create note: ' + error.message }));
        }
      });
      return;
    }

    // Delete note for customer
    if (pathname.match(/^\/api\/customers\/[^\/]+\/notes\/\d+$/) && req.method === 'DELETE') {
      console.log('Delete note request received for:', pathname);
      
      if (!isAuthenticated(req)) {
        console.log('Delete note failed: Not authenticated');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Authentication required' }));
        return;
      }

      try {
        const pathParts = pathname.split('/');
        const customerId = pathParts[3];
        const noteId = parseInt(pathParts[5]);
        
        console.log('Deleting note:', noteId, 'for customer:', customerId);
        
        // Get the authenticated user
        const user = await authService.getUserById(req.session.userId);
        if (!user) {
          console.log('Delete note failed: User not found');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }

        // Only admins can delete notes
        if (user.role !== 'admin') {
          console.log('Delete note failed: User not admin');
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Only administrators can delete notes' }));
          return;
        }
        
        const result = await pool.query(
          'DELETE FROM customer_notes WHERE id = $1 AND customer_id = $2 RETURNING *',
          [noteId, customerId]
        );

        if (result.rows.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Note not found' }));
          return;
        }

        console.log('Note deleted successfully:', result.rows[0]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Note deleted successfully' }));
        
      } catch (error) {
        console.error('Error deleting note:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to delete note: ' + error.message }));
      }
      return;
    }

    // This notes route was moved above to fix route matching order

    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() }));
      return;
    }

    // Serve uploaded files
    if (pathname.startsWith('/uploads/')) {
      let filePath = `./public${pathname}`;
      
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
        return;
      } catch {
        res.writeHead(404);
        res.end('File not found');
        return;
      }
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
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CRM Server running on port ${PORT}`);
  console.log('Database connected and ready');
});