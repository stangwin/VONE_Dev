// CommonJS module
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { IncomingForm } = require('formidable');
const crypto = require('crypto');
const OpenAI = require('openai');
const jwt = require('jsonwebtoken');
const { AuthService } = require('./server/auth');

// Load environment variables
require('dotenv').config();

// Environment detection
const isDevelopment = process.env.ENVIRONMENT === 'development';
console.log('Environment:', isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION');

// Environment-based port configuration for dual environment support
const PORT = isDevelopment ? (process.env.DEV_PORT || 3000) : (process.env.PORT || 5000);

// Database URL selection with isolation safeguards
let databaseUrl;
if (isDevelopment) {
  // Development mode - ONLY use development database
  databaseUrl = process.env.DATABASE_URL_DEV;
  if (!databaseUrl) {
    console.warn('⚠️  No DATABASE_URL_DEV configured. Using temporary mode for testing authentication.');
    console.warn('⚠️  Database features will not work. Please configure DATABASE_URL_DEV for full functionality.');
    // Use a placeholder to prevent crashes - no database operations will work
    databaseUrl = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
  } else {
    console.log('🔒 Using DEVELOPMENT database (isolated from production)');
  }
} else {
  // Production mode - ONLY use production database
  databaseUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('CRITICAL ERROR: Production mode requires DATABASE_URL_PROD or DATABASE_URL');
    process.exit(1);
  }
  console.log('🔒 Using PRODUCTION database');
}

// Additional safety check to prevent cross-environment contamination
if (isDevelopment && databaseUrl.includes('prod')) {
  console.error('🚨 SAFETY VIOLATION: Development mode cannot use production database URL');
  console.error('Database URL contains "prod" but environment is development');
  process.exit(1);
}

if (!isDevelopment && databaseUrl.includes('dev')) {
  console.warn('⚠️  WARNING: Production mode using database URL containing "dev"');
  console.warn('Verify this is intentional');
}

// Initialize database and authentication
let pool;
let authService;

// Connect to database for data operations
console.log('🔧 ===== DATABASE CONNECTION STARTUP =====');
console.log('🔧 Environment:', isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION');
console.log('🔧 Database URL configured:', !!databaseUrl);
console.log('🔧 Database URL preview:', databaseUrl ? databaseUrl.substring(0, 50) + '...' : 'NOT CONFIGURED');
console.log('🔧 Attempting database connection...');

try {
  pool = new Pool({ connectionString: databaseUrl });
  console.log('🔒 Database pool created, testing connection...');
  
  // Test the connection synchronously
  pool.query('SELECT NOW()', (err, result) => {
    if (err) {
      console.error('❌ Database connection test failed:', err.message);
    } else {
      console.log('🔒 Database connected successfully');
    }
  });
  
  // Initialize auth service
  authService = new AuthService(pool);
  console.log('🔐 JWT Authentication system initialized');
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  console.log('⚠️  Using fallback authentication mode');
  pool = null;
}

// Initialize auth service based on database availability
if (databaseUrl.includes('placeholder') || !pool) {
  console.log('🧪 Running in TEST MODE - database features disabled');
  // Mock auth service for testing
  authService = {
    authenticateUser: async (email, password) => {
      if (email === 'test@test.com' && password === 'test123') {
        return { 
          id: 1, 
          name: 'Development User', 
          email: 'test@test.com', 
          role: 'admin',
          two_factor_enabled: false
        };
      }
      throw new Error('Invalid credentials');
    },
    getUserById: async (id) => {
      if (id === 1) {
        return { 
          id: 1, 
          name: 'Development User', 
          email: 'test@test.com', 
          role: 'admin',
          two_factor_enabled: false
        };
      }
      return null;
    },
    // Mock customer data for testing
    getCustomers: async () => {
      return [
        {
          id: 1,
          customer_id: "customer_001",
          company_name: "My Pharmacist On Call",
          status: "Onboarding",
          affiliate_partner: "VOXO",
          next_step: "Schedule Install",
          physical_address: "3426 Whittier Blvd, Los Angeles, CA, 90023",
          billing_address: "3426 Whittier Blvd, Los Angeles, CA, 90023",
          primary_contact: {
            name: "Jacqueline",
            email: "ashers.assistant@gmail.com",
            phone: "310-882-6661"
          },
          authorized_signer: {
            name: "Asher Eghbali",
            email: "asher.eghbali@gmail.com",
            phone: ""
          },
          billing_contact: {
            name: "Asher Eghbali",
            email: "ahsher.eghbali@gmail.com",
            phone: "310-497-3109"
          },
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          customer_id: "customer_002",
          company_name: "Berea Drug",
          status: "Onboarding",
          affiliate_partner: "VOXO",
          next_step: "Perform Install",
          physical_address: "402 Richmond Road North, Berea, KY, 40403",
          billing_address: "402 Richmond Road North, Berea, KY, 40403",
          primary_contact: {
            name: "Robert Little",
            email: "bereadrug@yahoo.com",
            phone: "859-986-4521"
          },
          authorized_signer: {
            name: "Robert Little",
            email: "bereadrug@yahoo.com",
            phone: ""
          },
          billing_contact: {
            name: "Robert Little",
            email: "bereadrug@yahoo.com",
            phone: "859-986-4521"
          },
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          customer_id: "customer_003",
          company_name: "Southeast Pharmacy",
          status: "Onboarding",
          affiliate_partner: "VOXO",
          next_step: "Schedule Install",
          physical_address: "400 Parker Avenue North, STE 500A, Brooklet, GA, 30415",
          billing_address: "400 Parker Avenue North, STE 500A, Brooklet, GA, 30415",
          primary_contact: {
            name: "Shelby Hook",
            email: "hookrx@gmail.com",
            phone: "912-842-2040"
          },
          authorized_signer: {
            name: "Shelby Hook",
            email: "hookrx@gmail.com",
            phone: ""
          },
          billing_contact: {
            name: "Shelby Hook",
            email: "hookrx@gmail.com",
            phone: "912-842-2040"
          },
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 4,
          customer_id: "customer_004",
          company_name: "Rancho Pueblo Pharmacy", 
          status: "Quoted",
          affiliate_partner: "VOXO",
          next_step: "Follow with VOXO AE",
          physical_address: "",
          billing_address: "",
          primary_contact: {
            name: "Yash Patel",
            email: "yashpatel031998@gmail.com",
            phone: "951-972-8822"
          },
          authorized_signer: {
            name: "Yash Patel",
            email: "yashpatel031998@gmail.com",
            phone: ""
          },
          billing_contact: {
            name: "",
            email: "",
            phone: ""
          },
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 5,
          customer_id: "customer_005",
          company_name: "CR Care Pharmacy",
          status: "Lead",
          affiliate_partner: "VOXO",
          next_step: "Follow with VOXO AE",
          physical_address: "3100 E Avenue NW, Suite 102, Cedar Rapids, IA, 52405",
          billing_address: "3100 E Avenue NW, Suite 102, Cedar Rapids, IA, 52405",
          primary_contact: {
            name: "Jackie Fitzgerald",
            email: "crcarerx@gmail.com",
            phone: "319-200-1188"
          },
          authorized_signer: {
            name: "Jackie Fitzgerald",
            email: "crcarerx@gmail.com",
            phone: ""
          },
          billing_contact: {
            name: "",
            email: "",
            phone: ""
          },
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
    },
    // Mock affiliate data for testing
    getAffiliates: async () => {
      return [
        { id: 1, name: "VOXO", created_at: new Date() },
        { id: 2, name: "Direct", created_at: new Date() },
        { id: 3, name: "Partner Network", created_at: new Date() }
      ];
    }
  };
} else if (isDevelopment && databaseUrl.includes('schema=vantix_dev')) {
  // Development with schema isolation - use base URL without schema parameter
  const baseUrl = databaseUrl.split('?schema=')[0];
  pool = new Pool({ 
    connectionString: baseUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  // Create wrapped pool that sets search_path for development
  const originalQuery = pool.query.bind(pool);
  pool.query = async function(text, params) {
    const client = await pool.connect();
    try {
      await client.query('SET search_path TO vantix_dev');
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  };
  authService = new AuthService(pool);
} else {
  // Production or separate development database - use as-is
  pool = new Pool({ 
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  authService = new AuthService(pool);
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// JWT secret for token signing
const JWT_SECRET = process.env.JWT_SECRET || 'vantix-crm-jwt-secret-change-in-production';

// JWT authentication functions
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: user.name 
    }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// JWT authentication check function
function isAuthenticated(req) {
  return req.isAuthenticated === true && !!req.user;
}

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

// Removed devSessions - using pure cookie authentication

// JWT authentication wrapper for HTTP server  
async function handleRequest(req, res, handler) {
  // Extract JWT token from Authorization header
  const token = extractTokenFromHeader(req);
  
  if (token) {
    const user = verifyToken(token);
    if (user) {
      req.user = user;
      req.isAuthenticated = true;
      console.log('🔍 JWT Auth: User authenticated:', user.email);
    } else {
      console.log('🔍 JWT Auth: Invalid token');
      req.user = null;
      req.isAuthenticated = false;
    }
  } else {
    req.user = null;
    req.isAuthenticated = false;
  }
  
  handler(req, res);
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Add request logging
  console.log(`🌐 [${new Date().toISOString()}] ${req.method} ${pathname}`);
  console.log(`   Origin: ${req.headers.origin || 'none'}`);
  console.log(`   Host: ${req.headers.host}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 50)}...`);
  
  // CORS handling - Fixed for credentials
  if (pathname.startsWith('/api/')) {
    console.log(`   🔧 Setting CORS headers for API request`);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'https://vone-development-server.onrender.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Dev-Session');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Environment info endpoint (before session handling)
  if (pathname === '/api/environment') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      environment: isDevelopment ? 'development' : 'production',
      isDevelopment: isDevelopment,
      databaseType: isDevelopment ? 'development' : 'production',
      databaseIsolated: true
    }));
    return;
  }

  // Database status endpoint (before session handling)
  if (pathname === '/api/database-status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const dbInfo = {
      environment: isDevelopment ? 'development' : 'production',
      databaseUrl: databaseUrl ? databaseUrl.substring(0, 30) + '...' : 'not configured',
      isolation: {
        isDevelopment: isDevelopment,
        usesDevDatabase: isDevelopment && databaseUrl?.includes('dev'),
        usesProdDatabase: !isDevelopment && (databaseUrl?.includes('prod') || !databaseUrl?.includes('dev')),
        safetyChecksActive: true
      }
    };
    res.end(JSON.stringify(dbInfo));
    return;
  }

  // Health check endpoint (before session handling)
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'OK', 
      environment: isDevelopment ? 'development' : 'production',
      timestamp: new Date().toISOString() 
    }));
    return;
  }

  // Dev console route protection
  if (pathname === '/dev-console') {
    if (!isDevelopment) {
      res.writeHead(403, { 'Content-Type': 'text/html' });
      res.end('<h1>403 Forbidden</h1><p>Dev console is only available in development mode.</p>');
      return;
    }
    
    // Serve dev console HTML
    const filePath = path.join(__dirname, 'dev-console.html');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    }
  }

  // Handle requests with JWT authentication
  return await handleRequest(req, res, async (req, res) => {
    


    // Block all dev endpoints in production
    if (pathname.startsWith('/api/dev/')) {
      if (!isDevelopment) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Development endpoints only available in development mode' }));
        return;
      }
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

        let user;
        
        // Try normal authentication first
        try {
          user = await authService.authenticateUser(email, password);
        } catch (error) {
          console.log('Authentication failed:', error.message);
          user = null;
        }
        
        // Development bypass for test credentials when normal authentication fails
        if (!user && isDevelopment && email === 'test@test.com' && password === 'test123') {
          user = { 
            id: 1, 
            name: 'Development User', 
            email: 'test@test.com', 
            role: 'admin',
            two_factor_enabled: false
          };
        }
        
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid email or password' }));
          return;
        }

        // Generate JWT token
        const token = generateToken(user);
        console.log('🔍 JWT Auth: Token generated for user:', user.email);
        
        const response = { 
          user,
          token 
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        return;
      }

      if (pathname === '/api/auth/logout' && req.method === 'POST') {
        // JWT logout - client handles token removal
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Logged out successfully' }));
        return;
      }

      if (pathname === '/api/auth/me' && req.method === 'GET') {
        console.log('🔍 JWT Auth: /api/auth/me request');
        
        if (!req.user || !req.isAuthenticated) {
          console.log('🔍 JWT Auth: No valid token found');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not authenticated' }));
          return;
        }

        const user = await authService.getUserById(req.user.id);
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ user }));
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
        
        // Handle test mode with mock data
        if (databaseUrl.includes('placeholder')) {
          const customers = await authService.getCustomers();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(customers));
          return;
        }
        
        // Simple customer query for production (exclude deleted customers)
        const result = await pool.query(`
          SELECT c.*
          FROM customers c
          WHERE c.deleted_at IS NULL
          ORDER BY c.company_name
        `);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows));
        return;
      }



      // Get notes for customer (must come before general customer GET)
      if (req.method === 'GET' && pathname.match(/^\/api\/customers\/[a-zA-Z0-9_-]+\/notes$/)) {
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

      // Get file counts for all customers
      if (req.method === 'GET' && pathname === '/api/customers/file-counts') {
        if (!isAuthenticated(req)) {
          if (!res.headersSent) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Authentication required' }));
          }
          return;
        }
        
        try {
          const query = 'SELECT customer_id, COUNT(*) as file_count FROM customer_files GROUP BY customer_id';
          const result = await pool.query(query);
          
          // Convert to object for easier lookup
          const fileCounts = {};
          result.rows.forEach(row => {
            fileCounts[row.customer_id] = parseInt(row.file_count);
          });
          
          if (!res.headersSent) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(fileCounts));
          }
        } catch (error) {
          console.error('Error fetching file counts:', error);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch file counts' }));
          }
        }
        return;
      }

      // Get files for customer (must come before general customer GET)
      if (req.method === 'GET' && pathname.match(/^\/api\/customers\/[a-zA-Z0-9_-]+\/files$/)) {
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
        const result = await pool.query('SELECT * FROM customers WHERE customer_id = $1 AND deleted_at IS NULL', [customerId]);
        
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
        console.log('=== POST CUSTOMER DEBUG ===');
        console.log('Request body:', JSON.stringify(body, null, 2));
        
        const {
          customerId, customer_id, company_name, companyName, status, affiliate_partner, affiliatePartner, next_step, nextStep,
          physical_address, physicalAddress, billing_address, billingAddress, primary_contact, primaryContact, 
          authorized_signer, authorizedSigner, billing_contact, billingContact, notes
        } = body;
        
        // Use flexible field mapping to handle both naming conventions
        const finalCompanyName = company_name || companyName;
        const finalCustomerId = customer_id || customerId || `customer_${Date.now()}`;
        const finalStatus = status || 'Lead';
        const finalAffiliatePartner = affiliate_partner || affiliatePartner;
        const finalNextStep = next_step || nextStep;
        const finalPhysicalAddress = physical_address || physicalAddress;
        const finalBillingAddress = billing_address || billingAddress;
        const finalPrimaryContact = primary_contact || primaryContact;
        const finalAuthorizedSigner = authorized_signer || authorizedSigner;
        const finalBillingContact = billing_contact || billingContact;
        const finalNotes = notes || [];
        
        console.log('Final mapped values:');
        console.log('  company_name:', finalCompanyName);
        console.log('  customer_id:', finalCustomerId);
        console.log('  status:', finalStatus);
        
        if (!finalCompanyName) {
          console.error('ERROR: company_name is null or undefined');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Company name is required' }));
          return;
        }
        
        try {
          const result = await pool.query(
            `INSERT INTO customers (customer_id, company_name, status, affiliate_partner, next_step, 
             physical_address, billing_address, primary_contact, authorized_signer, billing_contact, notes, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
            [finalCustomerId, finalCompanyName, finalStatus, finalAffiliatePartner, finalNextStep, finalPhysicalAddress, finalBillingAddress, 
             JSON.stringify(finalPrimaryContact), JSON.stringify(finalAuthorizedSigner), JSON.stringify(finalBillingContact), JSON.stringify(finalNotes)]
          );
          
          // Create system note for customer creation
          try {
            const user = await authService.getUserById(req.session.userId);
            const noteQuery = `
              INSERT INTO customer_notes (customer_id, content, note_type, created_by, created_at)
              VALUES ($1, $2, $3, $4, NOW()) RETURNING *
            `;
            await pool.query(noteQuery, [finalCustomerId, `Customer record created by ${user.name}`, 'system', req.session.userId]);
            console.log('System note created successfully');
          } catch (noteError) {
            console.error('Failed to create system note:', noteError);
          }
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result.rows[0]));
        } catch (error) {
          console.error('Database error creating customer:', error);
          console.error('Error stack:', error.stack);
          
          // Check for duplicate constraint violation
          if (error.code === '23505' && error.constraint === 'unique_company_billing') {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'duplicate' }));
            return;
          }
          
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Database error: ' + error.message }));
        }
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
        
        if ('affiliate_account_executive' in body) {
          updateFields.push(`affiliate_account_executive = $${paramIndex}`);
          updateValues.push(body.affiliate_account_executive || null);
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
      if (req.method === 'DELETE' && pathname.match(/^\/api\/customers\/[a-zA-Z0-9_-]+\/files\/\d+$/)) {
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

      // Customer soft-deletion (exact path only, not file paths)
      if (pathname.match(/^\/api\/customers\/[a-zA-Z0-9_-]+$/) && req.method === 'DELETE') {
        console.log('🔥 BACKEND DELETE REQUEST RECEIVED');
        console.log('1. Pathname:', pathname);
        console.log('2. Method:', req.method);
        console.log('3. Session userId:', req.session?.userId);
        console.log('4. Session user email:', req.session?.user?.email);
        console.log('5. Request headers:', req.headers);
        
        if (!isAuthenticated(req)) {
          console.log('6. ❌ Authentication failed');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }
        
        console.log('7. ✅ User authenticated');
        
        // Check if user is admin
        const user = await authService.getUserById(req.session.userId);
        console.log('8. User lookup result:', user);
        
        if (!user || user.role !== 'admin') {
          console.log('9. ❌ Admin access denied, user role:', user?.role);
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin access required' }));
          return;
        }
        
        console.log('10. ✅ Admin access confirmed');
        
        const customerId = pathname.split('/')[3];
        console.log('11. Customer ID extracted:', customerId);
        
        // Soft delete: set deleted_at timestamp
        const schema = process.env.DATABASE_URL_DEV ? 'vantix_dev' : 'public';
        console.log('12. Schema determined:', schema);
        
        const updateQuery = `UPDATE ${schema}.customers SET deleted_at = NOW() WHERE customer_id = $1 AND deleted_at IS NULL RETURNING *`;
        console.log('13. SQL Query:', updateQuery);
        console.log('14. Query params:', [customerId]);
        
        const result = await pool.query(updateQuery, [customerId]);
        console.log('15. Query result rows:', result.rows.length);
        
        if (result.rows.length === 0) {
          console.log('16. ❌ Customer not found or already deleted');
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Customer not found or already deleted' }));
          return;
        }
        
        console.log('17. ✅ Customer soft-deleted successfully');
        
        // Create system note for deletion
        try {
          const noteQuery = `
            INSERT INTO ${schema}.customer_notes (customer_id, content, created_by, created_at)
            VALUES ($1, $2, $3, NOW()) RETURNING *
          `;
          console.log('18. Creating system note...');
          await pool.query(noteQuery, [customerId, `Customer archived by ${user.name}`, req.session.userId]);
          console.log('19. ✅ System note created');
        } catch (noteError) {
          console.error('20. ❌ Failed to create deletion system note:', noteError);
        }
        
        const successResponse = { message: 'Customer archived successfully' };
        console.log('21. Sending success response:', successResponse);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(successResponse));
        return;
      }

      // Get all affiliates
      if (pathname === '/api/affiliates' && req.method === 'GET') {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }

        // Handle test mode with mock data
        if (databaseUrl.includes('placeholder')) {
          const affiliates = await authService.getAffiliates();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(affiliates));
          return;
        }

        try {
          const result = await pool.query('SELECT * FROM affiliates ORDER BY name');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result.rows));
        } catch (error) {
          console.error('Get affiliates error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch affiliates' }));
        }
        return;
      }

      // Get all affiliate account executives (optionally filtered by affiliate)
      if (pathname === '/api/affiliate-aes' && req.method === 'GET') {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }

        try {
          const query = parsedUrl.query.affiliate_id 
            ? 'SELECT * FROM affiliate_aes WHERE affiliate_id = $1 ORDER BY name'
            : 'SELECT * FROM affiliate_aes ORDER BY name';
          
          const params = parsedUrl.query.affiliate_id ? [parsedUrl.query.affiliate_id] : [];
          const result = await pool.query(query, params);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result.rows));
        } catch (error) {
          console.error('Get affiliate AEs error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch affiliate account executives' }));
        }
        return;
      }

      // Create new affiliate
      if (pathname === '/api/affiliates' && req.method === 'POST') {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }

        try {
          const body = await parseJsonBody(req);
          
          if (!body.name || body.name.trim() === '') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Affiliate name is required' }));
            return;
          }

          const result = await pool.query(
            'INSERT INTO affiliates (id, name) VALUES (gen_random_uuid(), $1) RETURNING *',
            [body.name.trim()]
          );
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result.rows[0]));
        } catch (error) {
          console.error('Create affiliate error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to create affiliate' }));
        }
        return;
      }

      // Create new affiliate account executive
      if (pathname === '/api/affiliate-aes' && req.method === 'POST') {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }

        try {
          const body = await parseJsonBody(req);
          
          if (!body.name || body.name.trim() === '') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Account Executive name is required' }));
            return;
          }

          if (!body.affiliate_id) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Affiliate ID is required' }));
            return;
          }

          const result = await pool.query(
            'INSERT INTO affiliate_aes (id, affiliate_id, name) VALUES (gen_random_uuid(), $1, $2) RETURNING *',
            [body.affiliate_id, body.name.trim()]
          );
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result.rows[0]));
        } catch (error) {
          console.error('Create affiliate AE error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to create affiliate account executive' }));
        }
        return;
      }

      // File upload endpoint - more permissive regex for customer IDs
      if (req.method === 'POST' && pathname.match(/^\/api\/customers\/[a-zA-Z0-9_-]+\/files$/)) {
        if (!isAuthenticated(req)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }
        const customerId = pathname.split('/')[3];
        console.log('File upload request for customer:', customerId);
        console.log('Full pathname:', pathname);
        
        // Validate customer ID format
        if (!/^[a-zA-Z0-9_-]+$/.test(customerId)) {
          console.error('Invalid customer ID format:', customerId);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid customer ID format' }));
          return;
        }
        
        const form = new IncomingForm({
          uploadDir: `./public/uploads/${customerId}`,
          keepExtensions: true,
          maxFileSize: 50 * 1024 * 1024, // 50MB per file - consistent with frontend
          maxTotalFileSize: 200 * 1024 * 1024, // 200MB total to accommodate multiple files
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
            console.error('Error details:', err.stack);
            console.error('Customer ID:', customerId);
            console.error('Upload directory:', uploadDir);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Upload failed: ' + err.message }));
            return;
          }

          console.log('Files received:', files);
          console.log('Fields received:', fields);
          console.log('Customer ID from route:', customerId);
          
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
              console.log('File mimetype:', file.mimetype);
              console.log('File size:', file.size);

              // Validate file extension
              const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif', '.pdf', '.mp4', '.mov', '.avi', '.webm'];
              const ext = path.extname(file.originalFilename).toLowerCase();
              
              if (!allowedExtensions.includes(ext)) {
                console.error('Invalid file extension:', ext);
                console.error('Allowed extensions:', allowedExtensions);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `File extension ${ext} not allowed. Allowed: ${allowedExtensions.join(', ')}` }));
                return;
              }

              // Validate file size (50MB limit to match frontend)
              if (file.size > 50 * 1024 * 1024) {
                console.error('File too large:', file.size, 'bytes (max: 50MB)');
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'File must be less than 50MB' }));
                return;
              }

              // Generate unique filename - sanitize original name
              const timestamp = Date.now();
              const randomSuffix = Math.round(Math.random() * 1E9);
              const fileName = `${timestamp}-${randomSuffix}${ext}`;
              const newPath = path.join(uploadDir, fileName);
              
              console.log('Generated filename:', fileName);
              console.log('Target path:', newPath);

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
          console.log('Note data received:', noteData);
          
          const noteType = noteData.type || 'manual';
          const authorName = noteType === 'system' ? 'System' : user.name;
          
          console.log('Final note type:', noteType, 'Author name:', authorName);
          
          const result = await pool.query(
            `INSERT INTO customer_notes (customer_id, author_id, author_name, content, type, timestamp, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
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

    // Create system note endpoint
    if (pathname.match(/^\/api\/customers\/[a-zA-Z0-9_-]+\/system-notes$/) && req.method === 'POST') {
      if (!isAuthenticated(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Authentication required' }));
        return;
      }

      const customerId = pathname.split('/')[3];
      
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const systemNoteData = JSON.parse(body);
          
          // Get user info for system note
          const user = await authService.getUserById(req.session.userId);
          if (!user) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }
          
          const systemContent = `🤖 System: ${systemNoteData.content} (triggered by ${user.name || user.email})`;
          
          console.log('Creating system note for customer:', customerId, 'Content:', systemContent);

          const result = await pool.query(
            `INSERT INTO customer_notes (customer_id, author_id, author_name, content, type, timestamp, created_at)
             VALUES ($1, $2, $3, $4, 'system', NOW(), NOW())
             RETURNING *`,
            [customerId, user.id, 'System', systemContent]
          );

          console.log('System note created successfully:', result.rows[0]);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result.rows[0]));
        } catch (error) {
          console.error('Error creating system note:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to create system note: ' + error.message }));
        }
      });
      return;
    }

    // Delete note for customer
    if (pathname.match(/^\/api\/customers\/[a-zA-Z0-9_-]+\/notes\/\d+$/) && req.method === 'DELETE') {
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



    // Parse text with OpenAI
    if (pathname === '/api/parse-text' && req.method === 'POST') {
      console.log('Parse text request received');
      
      if (!isAuthenticated(req)) {
        console.log('Parse text failed: Authentication required');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Authentication required - please log in first' }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { text } = JSON.parse(body);
          
          if (!text || typeof text !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Text content is required' }));
            return;
          }

          console.log('Sending text to OpenAI for parsing:', text.substring(0, 100) + '...');

          const prompt = `You are an assistant for a CRM system. Given this unstructured email or note, extract and return structured customer data in JSON format. 

Extract these specific fields if available:
- customer_name (company/business name)
- contact_name (primary contact person)
- contact_title (job title/position)  
- contact_phone
- contact_email
- company_address (physical location)
- billing_address (if different from company address)
- number_of_locations
- service_requested (type of service needed)
- urgency_level (high/medium/low)

IMPORTANT: Also include a "notes_summary" field that captures ALL additional relevant information that doesn't fit into the specific fields above. This should include:
- Timeline details, deadlines, meeting dates
- Special requirements or preferences
- Budget information or financial details
- Background context or history
- Follow-up actions needed
- Any other business-relevant details mentioned

Return only valid JSON with all available information structured appropriately.

Text to parse:
${text}`;

          const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            max_tokens: 1000,
          });

          const parsedData = JSON.parse(response.choices[0].message.content);
          console.log('OpenAI parsed data:', parsedData);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(parsedData));
        } catch (error) {
          console.error('Error parsing text with OpenAI:', error);
          console.error('Error details:', error.stack);
          console.error('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
          
          let errorMessage = 'Failed to parse text';
          if (error.message.includes('API key')) {
            errorMessage = 'OpenAI API key not configured properly';
          } else if (error.message.includes('rate limit')) {
            errorMessage = 'OpenAI API rate limit exceeded';
          } else if (error.message.includes('timeout')) {
            errorMessage = 'OpenAI API request timed out';
          } else {
            errorMessage = 'OpenAI API error: ' + error.message;
          }
          
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: errorMessage }));
        }
      });
      return;
    }

    // Health check endpoint
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

      // Development-only API endpoints
      if (pathname.startsWith('/api/dev/') && isDevelopment) {
        
        // Dev API: Database statistics
        if (pathname === '/api/dev/database-stats') {
          if (!isAuthenticated(req)) {
            if (!res.headersSent) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Authentication required' }));
            }
            return;
          }

          try {
            const [customerResult, fileResult, noteResult, userResult] = await Promise.all([
              pool.query('SELECT COUNT(*) FROM customers'),
              pool.query('SELECT COUNT(*) FROM customer_files'),
              pool.query('SELECT COUNT(*) FROM customer_notes'),
              pool.query('SELECT COUNT(*) FROM users')
            ]);

            const stats = {
              customers: parseInt(customerResult.rows[0].count),
              files: parseInt(fileResult.rows[0].count),
              notes: parseInt(noteResult.rows[0].count),
              users: parseInt(userResult.rows[0].count)
            };

            if (!res.headersSent) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(stats));
            }
          } catch (error) {
            console.error('Database stats error:', error);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to fetch database statistics' }));
            }
          }
          return;
        }

        // Dev API: Load sample data
        if (pathname === '/api/dev/load-sample-data' && req.method === 'POST') {
          if (!isAuthenticated(req)) {
            if (!res.headersSent) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Authentication required' }));
            }
            return;
          }

          try {
            const sampleCustomers = [
              {
                customer_id: 'sample_001',
                company_name: 'TechStart Inc',
                primary_contact: JSON.stringify({
                  name: 'John Smith',
                  email: 'john@techstart.com',
                  phone: '555-0101'
                }),
                status: 'active',
                affiliate_partner: 'Tech Partners',
                next_step: 'Schedule demo'
              },
              {
                customer_id: 'sample_002',
                company_name: 'Digital Solutions LLC',
                primary_contact: JSON.stringify({
                  name: 'Sarah Johnson',
                  email: 'sarah@digitalsolutions.com',
                  phone: '555-0102'
                }),
                status: 'pending',
                affiliate_partner: 'Growth Network',
                next_step: 'Send proposal'
              },
              {
                customer_id: 'sample_003',
                company_name: 'Innovation Labs',
                primary_contact: JSON.stringify({
                  name: 'Mike Chen',
                  email: 'mike@innovationlabs.com',
                  phone: '555-0103'
                }),
                status: 'completed',
                affiliate_partner: 'Direct',
                next_step: 'Project complete'
              }
            ];

            for (const customer of sampleCustomers) {
              await pool.query(`
                INSERT INTO customers (customer_id, company_name, primary_contact, status, affiliate_partner, next_step, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                ON CONFLICT (customer_id) DO NOTHING
              `, [
                customer.customer_id,
                customer.company_name,
                customer.primary_contact,
                customer.status,
                customer.affiliate_partner,
                customer.next_step
              ]);

              // Add sample notes
              await pool.query(`
                INSERT INTO customer_notes (customer_id, content, author_name, type, created_at)
                VALUES ($1, $2, $3, $4, NOW())
              `, [
                customer.customer_id,
                `Sample note for ${customer.company_name}: Initial contact established and requirements discussed.`,
                'System',
                'system'
              ]);
            }

            if (!res.headersSent) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                message: `${sampleCustomers.length} sample customers added with notes`,
                count: sampleCustomers.length
              }));
            }
          } catch (error) {
            console.error('Load sample data error:', error);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to load sample data' }));
            }
          }
          return;
        }

        // Dev API: Sync from production (Development only)
        if (pathname === '/api/dev/sync-from-prod' && req.method === 'POST') {
          if (!isAuthenticated(req)) {
            if (!res.headersSent) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Authentication required' }));
            }
            return;
          }

          try {
            const { DatabaseSyncTool } = require('./dev-database-sync.js');
            const syncTool = new DatabaseSyncTool();
            
            await syncTool.init();
            
            // Clear development data and sync all production data
            const syncResult = await syncTool.syncAllFromProdToDev();
            
            await syncTool.close();
            
            if (!res.headersSent) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                message: 'Successfully synced all production data to development',
                ...syncResult
              }));
            }
          } catch (error) {
            console.error('Sync error:', error);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message }));
            }
          }
          return;
        }

        // Dev API: Database comparison
        if (pathname === '/api/dev/compare-databases' && req.method === 'POST') {
          if (!isAuthenticated(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Authentication required' }));
            return;
          }

          try {
            const { DatabaseSyncTool } = require('./dev-database-sync.js');
            const syncTool = new DatabaseSyncTool();
            
            await syncTool.init();
            const report = await syncTool.generateReport();
            await syncTool.close();
            
            if (!res.headersSent) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(report));
            }
          } catch (error) {
            console.error('Database comparison error:', error);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                error: 'Failed to compare databases: ' + error.message,
                details: error.stack
              }));
            }
          }
          return;
        }

        // Dev API: Selective sync to production
        if (pathname === '/api/dev/sync-to-production' && req.method === 'POST') {
          if (!isAuthenticated(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Authentication required' }));
            return;
          }

          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', async () => {
            try {
              const { selectedItems } = JSON.parse(body);
              
              if (!selectedItems || !Array.isArray(selectedItems)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'selectedItems array is required' }));
                return;
              }

              const { DatabaseSyncTool } = require('./dev-database-sync.js');
              const syncTool = new DatabaseSyncTool();
              
              await syncTool.init();
              
              // Get the current comparison report
              const report = await syncTool.generateReport();
              
              let successful = 0;
              let failed = 0;
              const results = [];
              
              // Process each selected item
              for (const itemId of selectedItems) {
                const [tableName, recordId] = itemId.split('-');
                
                // Find the record in the missing data
                const missingRecords = report.missingInProd[tableName] || [];
                const record = missingRecords.find(r => r.id.toString() === recordId);
                
                if (record) {
                  try {
                    const success = await syncTool.syncRecordToProd(tableName, record);
                    if (success) {
                      successful++;
                      results.push({ item: itemId, status: 'success' });
                    } else {
                      failed++;
                      results.push({ item: itemId, status: 'failed', error: 'Sync operation failed' });
                    }
                  } catch (error) {
                    failed++;
                    results.push({ item: itemId, status: 'failed', error: error.message });
                  }
                } else {
                  failed++;
                  results.push({ item: itemId, status: 'failed', error: 'Record not found' });
                }
              }
              
              await syncTool.close();
              
              if (!res.headersSent) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  successful,
                  failed,
                  total: selectedItems.length,
                  results
                }));
              }
              
            } catch (error) {
              console.error('Sync to production error:', error);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  error: 'Failed to sync to production: ' + error.message 
                }));
              }
            }
          });
          return;
        }

        // Dev API: Changelog management
        if (pathname === '/api/dev/changelog') {
          if (!isAuthenticated(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Authentication required' }));
            return;
          }

          if (req.method === 'GET') {
            try {
              const changelogPath = path.join(__dirname, 'CHANGELOG.md');
              let content = '';
              if (fs.existsSync(changelogPath)) {
                content = fs.readFileSync(changelogPath, 'utf8');
              }
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ content }));
            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to read changelog' }));
            }
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
              try {
                const { content } = JSON.parse(body);
                const changelogPath = path.join(__dirname, 'CHANGELOG.md');
                fs.writeFileSync(changelogPath, content, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Changelog saved successfully' }));
              } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to save changelog' }));
              }
            });
            return;
          }
        }

        // Dev API: Import CSV data
        if (pathname === '/api/dev/import-csv-data' && req.method === 'POST') {
          if (!isAuthenticated(req)) {
            if (!res.headersSent) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Authentication required' }));
            }
            return;
          }

          try {
            // Helper function to parse JSON strings from CSV
            function parseJsonField(field) {
              if (!field || field === 'null' || field === '') return null;
              try {
                return JSON.parse(field);
              } catch (e) {
                console.warn(`⚠️  Failed to parse JSON field: ${field}`);
                return null;
              }
            }

            // Helper function to clean CSV data
            function cleanCsvValue(value) {
              if (value === 'null' || value === '') return null;
              return value;
            }

            console.log('🚀 Starting CSV data import...');

            // Import affiliates
            console.log('📊 Importing affiliates...');
            const affiliatesCsv = `id,name,created_at,updated_at
06c0d91f-4f8d-4e18-8ff0-a0a63177ef93,MedNet Solutions,2025-07-15 16:09:59.579698,2025-07-15 16:09:59.579698
2ec696e2-948e-4915-93d9-1b90951eb457,VOXO,2025-07-15 16:09:59.579698,2025-07-15 16:09:59.579698
8c4908fd-9c26-43b8-9d1a-0806e7a6d2cf,PharmaPartners,2025-07-15 16:09:59.579698,2025-07-15 16:09:59.579698`;

            const affiliateLines = affiliatesCsv.split('\n').filter(line => line.trim());
            for (let i = 1; i < affiliateLines.length; i++) {
              const values = affiliateLines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
              const affiliate = {
                id: values[0],
                name: values[1],
                created_at: values[2],
                updated_at: values[3]
              };
              
              await pool.query(`
                INSERT INTO affiliates (id, name, created_at, updated_at)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO UPDATE SET
                  name = EXCLUDED.name,
                  updated_at = EXCLUDED.updated_at
              `, [affiliate.id, affiliate.name, affiliate.created_at, affiliate.updated_at]);
              
              console.log(`✅ Imported affiliate: ${affiliate.name}`);
            }

            // Import customers
            console.log('📊 Importing customers...');
            const customersCsv = `id,customer_id,company_name,status,affiliate_partner,next_step,physical_address,billing_address,primary_contact,authorized_signer,billing_contact,created_at,updated_at,created_by,updated_by,affiliate_account_executive,premise_locations,docusign_status,notes,deleted_at,next_step_due
1,customer_001,My Pharmacist On Call,Onboarding,VOXO,Perform Install and Test,"3426 Whittier Blvd, Los Angeles, CA, 90023","3426 Whittier Blvd, Los Angeles, CA, 90023","{""name"": ""Jacqueline"", ""email"": ""ashers.assistant@gmail.com"", ""phone"": ""310-882-6661""}","{""name"": ""Asher Eghbali"", ""email"": ""asher.eghbali@gmail.com"", ""phone"": """"}","{""name"": ""Asher Eghbali"", ""email"": ""ahsher.eghbali@gmail.com"", ""phone"": ""310-497-3109""}",2025-06-24 13:47:15.119522,2025-07-12 00:08:53.92627,,,,,,[],,
2,customer_002,Berea Drug,Onboarding,VOXO,Place in Billing,"402 Richmond Road North, Berea, KY, 40403","402 Richmond Road North, Berea, KY, 40403","{""name"": ""Robert Little"", ""email"": ""bereadrug@yahoo.com"", ""phone"": ""859-986-4521""}","{""name"": ""Robert Little"", ""email"": ""bereadrug@yahoo.com"", ""phone"": """"}","{""name"": ""Robert Little"", ""email"": ""bereadrug@yahoo.com"", ""phone"": ""859-986-4521""}",2025-06-24 13:47:15.119522,2025-07-25 03:04:54.004949,,,,,,[],,2025-07-31
3,customer_003,Southeast Pharmacy,Onboarding,VOXO,Place in Billing,"400 Parker Avenue North, STE 500A, Brooklet, GA, 30415","400 Parker Avenue North, STE 500A, Brooklet, GA, 30415","{""name"": ""Shelby Hook"", ""email"": ""hookrx@gmail.com"", ""phone"": ""912-842-2040""}","{""name"": ""Shelby Hook"", ""email"": ""hookrx@gmail.com"", ""phone"": """"}","{""name"": ""Shelby Hook"", ""email"": ""hookrx@gmail.com"", ""phone"": ""912-842-2040""}",2025-06-24 13:47:15.119522,2025-07-12 01:52:14.591349,,,,,,[],,
4,customer_004,Rancho Pueblo Pharmacy,Closed,VOXO,None,"","","{""name"": ""Yash Patel"", ""email"": ""yashpatel031998@gmail.com"", ""phone"": ""951-972-8822""}","{""name"": ""Yash Patel"", ""email"": ""yashpatel031998@gmail.com"", ""phone"": """"}","{""name"": """", ""email"": """", ""phone"": """"}",2025-06-24 13:47:15.119522,2025-07-14 14:13:02.33365,,,,,,[],,
5,customer_005,CR Care Pharmacy,Lead,VOXO,Follow with Affiliate AE,"3100 E Avenue NW, Suite 102, Cedar Rapids, IA, 52405","3100 E Avenue NW, Suite 102, Cedar Rapids, IA, 52405","{""name"": ""Jackie Fitzgerald"", ""email"": ""crcarerx@gmail.com"", ""phone"": ""319-200-1188""}","{""name"": ""Jackie Fitzgerald"", ""email"": ""crcarerx@gmail.com"", ""phone"": """"}","{""name"": """", ""email"": """", ""phone"": """"}",2025-06-24 13:47:15.119522,2025-07-16 17:15:30.587369,,,Neal Bontrager,,,[],,
6,customer_006,McCoy Tygart Drug,Lead,VOXO,Send Quote,"","","{""name"": ""Casey Hedden"", ""email"": ""casey@mccoytygartdrug.com"", ""phone"": """"}","{""name"": """", ""email"": """", ""phone"": """"}","{""name"": """", ""email"": """", ""phone"": """"}",2025-06-24 13:47:15.119522,2025-07-12 00:08:46.311514,,,Drake Druckenmiller,,,[],,
8,customer_008,Blanco Pharmacy and Wellness,Lead,VOXO,Follow with Affiliate AE,"","","{""name"": ""Blakelee Speer"", ""email"": ""blakelee2006@msn.com"", ""phone"": ""830-833-4815""}","{""name"": """", ""email"": """", ""phone"": """"}","{""name"": """", ""email"": """", ""phone"": """"}",2025-06-24 13:47:15.119522,2025-07-16 17:15:28.114665,,,Rusty Betts,,,[],,
9,customer_009,Vital Care Infusion Services,Closed,"",None,"","","{""name"": ""Jonathan Sims"", ""email"": """", ""phone"": ""601-596-2800""}","{""name"": ""Jonathan Sims"", ""email"": """", ""phone"": """"}","{""name"": """", ""email"": """", ""phone"": """"}",2025-06-24 13:47:15.119522,2025-07-15 16:57:08.971994,,,,,,[],,
10,customer_010,The Compounder,Closed,"",None,"","","{""name"": ""Jonathan Sims"", ""email"": """", ""phone"": ""601-596-2800""}","{""name"": ""Jonathan Sims"", ""email"": """", ""phone"": """"}","{""name"": """", ""email"": """", ""phone"": """"}",2025-06-24 13:47:15.119522,2025-07-15 16:57:02.132321,,,,,,[],,
11,customer_011,Delta Pharmacy,Closed,VOXO,,"","","{""name"": ""Willis High"", ""email"": ""WHigh@delta-rx.com"", ""phone"": ""843-813-7874""}","{""name"": """", ""email"": """", ""phone"": """"}","{""name"": """", ""email"": """", ""phone"": """"}",2025-06-24 13:47:15.119522,2025-07-25 02:47:04.44556,,,,,,[],,
12,customer_012,Mac Pharmacy,Lead,VOXO,Follow with Affiliate AE,"","","{""name"": ""Sherif Mankaryous"", ""email"": """", ""phone"": """"}","{""name"": """", ""email"": """", ""phone"": """"}","{""name"": """", ""email"": """", ""phone"": """"}",2025-06-24 13:47:15.119522,2025-07-16 17:15:40.959672,,,Neal Bontrager,,,[],,
14,customer_007,Sadler Hughes Apothecary,Onboarding,VOXO,Place in Billing,"102 Jacobs Hwy, Clinton, SC, 29325","102 Jacobs Hwy, Clinton, SC, 29325","{""name"": ""Walter Hughes"", ""email"": """", ""phone"": """"}","{""name"": ""Walter Hughes"", ""email"": ""whughes@sadlerhughes.com""}","{""name"": """", ""email"": """", ""phone"": """"}",2025-06-24 13:47:15.119,2025-07-12 00:09:46.886821,,,,,,[],,
21,customer_456247,Blacksburg Pharmacy,Lead,VOXO,Follow with Affiliate AE,,,"{""name"": ""Kamden Phillips"", ""email"": ""Kamden.solutionsrx@gmail.com"", ""phone"": ""540-750-1111""}","{""name"": ""Kamden Phillips"", ""email"": ""Kamden.solutionsrx@gmail.com"", ""phone"": ""540-750-0679""}","{""name"": ""Kamden Phillips"", ""email"": ""Kamden.solutionsrx@gmail.com"", ""phone"": ""540-750-0679""}",2025-07-11 17:20:56.921223,2025-07-25 02:59:38.642634,,,Rusty Betts,,,[],,2025-07-30
22,customer_1752255981406,Plains Drug,Signed,VOXO,Order Hardware,,,"{""name"": ""Eli"", ""email"": """", ""phone"": """"}","{""name"": ""Eli"", ""email"": """", ""phone"": null}","{""name"": ""Eli"", ""email"": """", ""phone"": """"}",2025-07-11 17:46:21.437463,2025-07-18 17:17:02.044837,,,Neal Bontrager,,,[],,
23,customer_1752596760694,Test Pharmacy Production,Lead,,,,,"{""name"": ""Test Contact"", ""email"": ""test@test.com"", ""phone"": ""555-1234""}",,,2025-07-15 16:26:00.729131,2025-07-15 16:26:00.729131,,,,,,[],2025-07-16 14:29:01.844652,
24,customer_1752596891855,Oakridge Pharmacy,Lead,,,,,"{""name"": ""Laura and Christian"", ""email"": ""postalpharmrx@outlook.com"", ""phone"": """"}","{""name"": ""Laura and Christian"", ""email"": ""postalpharmrx@outlook.com"", ""phone"": null}","{""name"": ""Laura and147:16:17:16:00.731263,
25,customer_1752596894930,Oakridge Pharmacy,Quoted,VOXO,Follow Up,,,"{""name"": ""Laura and Christian"", ""email"": ""postalpharmrx@outlook.com"", ""phone"": """"}","{""name"": ""Laura and Christian"", ""email"": ""postalpharmrx@outlook.com"", ""phone"": null}","{""name"": ""Laura and Christian"", ""email"": ""postalpharmrx@outlook.com"", ""phone"": """"}",2025-07-15 16:28:14.965844,2025-07-22 15:29:40.090015,,,,,,[],,
26,test_delete,Test Delete Company,Lead,,,,,"{""name"": ""Test User"", ""email"": ""test@delete.com"", ""phone"": ""555-1234""}",,,2025-07-15 16:36:17.722629,2025-07-15 16:36:17.722629,,,,,,"""Test customer for delete functionality""",2025-07-15 16:36:24.135455,
27,customer_test_1752599022.473956,Archive Test #1752599022.473956,Lead,,,,,"{""name"": ""Test User"", ""email"": ""test@test.com"", ""phone"": ""555-1234""}","{""name"": ""Test User"", ""email"": ""test@test.com"", ""phone"": ""test@test.com"", ""phone"": ""555-1234""}",2025-07-15 17:03:42.473956,2025-07-15 17:03:42.473956,,,,,,[],2025-07-15 17:03:55.152618,
28,customer_archive_bug_dev,Archive Bug Dev,Lead,,,,,"{""name"": ""Test User"", ""email"": ""test@test.com"", ""phone"": ""555-1234""}","{""name"": ""Test User"", ""email"": ""test@test.com"", ""phone"": ""555-1234""}","{""name"": ""Test User"", ""email"": ""test@test.com"", ""phone"": ""555-1234""}",2025-07-15 17:16:41.845512,2025-07-15 17:16:41.845512,,,,,,[],2025-07-16 14:28:24.358157,
29,customer_archive_test_dev2,Archive Test Dev₂,Lead,,,,,"{""name"": ""Test User"", ""email"": ""test@test.com"", ""phone"": ""555-1234""}","{""name"": ""Test User"", ""email"": ""test@test.com"", ""phone"": ""555-1234""}","{""name"": ""Test User"", ""email"": ""test@test.com"", ""phone"": ""555-1234""}",2025-07-15 17:17:36.936919,2025-07-15 17:17:36.936919,,,,,,[],2025-07-16 14:28:30.054669,
31,customer_archive_ui_test,Archive UI Test,Lead,,,,,"{""name"": ""Test User"", ""email"": ""test@example.com"", ""phone"": ""555-0123""}","{""name"": ""Test User"", ""email"": ""test@example.com"", ""phone"": ""555-0123""}","{""name"": ""Test User"", ""email"": ""test@example.com"", ""phone"": ""555-0123""}",2025-07-15 18:12:22.857817,2025-07-15 18:12:22.857817,,,,,,[],2025-07-15 20:24:49.912898,
32,customer_archive_test_live,Archive Test Live,Lead,,,,,"{""name"": ""Test User"", ""email"": ""test@live.com"", ""phone"": ""555-9999""}","{""name"": ""Test User"", ""email"": ""test@test@live.com"", ""phone"": ""555-9999""}","{""name"": ""Test User"", ""email"": ""test@live.com"", ""phone"": ""555-9999""}",2025-07-15 19:32:52.336105,2025-07-15 19:32:52.336105,,,,,,[],2025-07-16 14:28:38.252415,
33,customer_delete_flow_test,Delete Flow Test,Lead,,,,,"{""name"": ""Test Delete"", ""email"": ""test@delete.com"", ""phone"": ""555-8888""}","{""name"": ""Test Delete"", ""email"": ""test@delete.com"", ""phone"": ""555-8888""}","{""name"": ""Test Delete"", ""email"": ""test@delete.com"", ""phone"": ""555-8888""}",2025-07-15 19:52:37.112758,2025-07-15 19:52:37.112758,,,,,,[],2025-07-16 14:28:44.393693,
34,customer_1752858755499,test customer,Lead,,,,,"{""name"": """", ""email"": """", ""phone"": ""601-111-1111""}","{""name"": """", ""email"": """", ""phone"": ""601-111-1111""}","{""name"": """", ""email"": ""601-111-1111""}",2025-07-18 17:12:35.529866,2025-07-18 17:12:35.529866,,,,,,[],2025-07-22 15:30:05.621903,
35,customer_1753203739064,Beverly Hills Pharmacy,Lead,,Schedule Call,,,"{""name"": ""Craig Shaetz"", ""email"": """", ""phone"": ""+1 (314) 620-1401""}","{""name"": ""Craig Shaetz"", ""email"": """", ""phone"": ""+1 (314) 620-1401""}","{""name"": ""Craig Shaetz"", ""email"": """", ""phone"": ""+1 (314) 620-1401""}",2025-07-22 17:02:19.082539,2025-07-25 03:04:59.182473,,,,,,[],,2025-07-31`;

            const customerLines = customersCsv.split('\n').filter(line => line.trim());
            for (let i = 1; i < customerLines.length; i++) {
              const values = customerLines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
              
              // Parse JSON fields
              const primaryContact = parseJsonField(values[8]);
              const authorizedSigner = parseJsonField(values[9]);
              const billingContact = parseJsonField(values[10]);
              const premiseLocations = parseJsonField(values[16]);
              
              const customer = {
                id: parseInt(values[0]),
                customer_id: values[1],
                company_name: values[2],
                status: values[3],
                affiliate_partner: values[4],
                next_step: values[5],
                physical_address: cleanCsvValue(values[6]),
                billing_address: cleanCsvValue(values[7]),
                primary_contact: primaryContact,
                authorized_signer: authorizedSigner,
                billing_contact: billingContact,
                created_at: values[11],
                updated_at: values[12],
                created_by: cleanCsvValue(values[13]),
                updated_by: cleanCsvValue(values[14]),
                affiliate_account_executive: cleanCsvValue(values[15]),
                premise_locations: premiseLocations,
                docusign_status: cleanCsvValue(values[17]),
                notes: cleanCsvValue(values[18]),
                deleted_at: cleanCsvValue(values[19]),
                next_step_due: cleanCsvValue(values[20])
              };
              
              await pool.query(`
                INSERT INTO customers (
                  id, customer_id, company_name, status, affiliate_partner, next_step,
                  physical_address, billing_address, primary_contact, authorized_signer,
                  billing_contact, created_at, updated_at, created_by, updated_by,
                  affiliate_account_executive, premise_locations, docusign_status, notes,
                  deleted_at, next_step_due
                ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                  $16, $17, $18, $19, $20, $21
                ) ON CONFLICT (id) DO UPDATE SET
                  customer_id = EXCLUDED.customer_id,
                  company_name = EXCLUDED.company_name,
                  status = EXCLUDED.status,
                  affiliate_partner = EXCLUDED.affiliate_partner,
                  next_step = EXCLUDED.next_step,
                  physical_address = EXCLUDED.physical_address,
                  billing_address = EXCLUDED.billing_address,
                  primary_contact = EXCLUDED.primary_contact,
                  authorized_signer = EXCLUDED.authorized_signer,
                  billing_contact = EXCLUDED.billing_contact,
                  updated_at = EXCLUDED.updated_at,
                  updated_by = EXCLUDED.updated_by,
                  affiliate_account_executive = EXCLUDED.affiliate_account_executive,
                  premise_locations = EXCLUDED.premise_locations,
                  docusign_status = EXCLUDED.docusign_status,
                  notes = EXCLUDED.notes,
                  deleted_at = EXCLUDED.deleted_at,
                  next_step_due = EXCLUDED.next_step_due
              `, [
                customer.id, customer.customer_id, customer.company_name, customer.status,
                customer.affiliate_partner, customer.next_step, customer.physical_address,
                customer.billing_address, customer.primary_contact, customer.authorized_signer,
                customer.billing_contact, customer.created_at, customer.updated_at,
                customer.created_by, customer.updated_by, customer.affiliate_account_executive,
                customer.premise_locations, customer.docusign_status, customer.notes,
                customer.deleted_at, customer.next_step_due
              ]);
              
              console.log(`✅ Imported customer: ${customer.company_name} (${customer.customer_id})`);
            }

            // Import customer notes
            console.log('📊 Importing customer notes...');
            const notesCsv = `id,customer_id,content,author_name,timestamp
1,1,Initial contact established with Jacqueline. Discussed pharmacy automation needs and scheduling requirements.,System,2025-06-24 13:47:15.119522
2,2,Spoke with Robert about Berea Drug's current workflow and integration requirements.,System,2025-06-24 13:47:15.119522
3,3,Contacted Shelby Hook regarding Southeast Pharmacy's automation project timeline.,System,2025-06-24 13:47:15.119522
4,4,Rancho Pueblo Pharmacy - Project completed and system installed successfully.,System,2025-07-14 14:13:02.33365
5,5,CR Care Pharmacy - Initial consultation completed. Neal Bontrager assigned as AE.,System,2025-07-16 17:15:30.587369`;

            const noteLines = notesCsv.split('\n').filter(line => line.trim());
            for (let i = 1; i < noteLines.length; i++) {
              const values = noteLines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
              
              const note = {
                id: parseInt(values[0]),
                customer_id: parseInt(values[1]),
                content: values[2],
                author_name: values[3],
                timestamp: values[4]
              };
              
              await pool.query(`
                INSERT INTO customer_notes (id, customer_id, content, author_name, timestamp)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO UPDATE SET
                  content = EXCLUDED.content,
                  author_name = EXCLUDED.author_name,
                  timestamp = EXCLUDED.timestamp
              `, [note.id, note.customer_id, note.content, note.author_name, note.timestamp]);
              
              console.log(`✅ Imported note for customer ${note.customer_id}`);
            }

            console.log('🎉 CSV data import completed successfully!');
            
            // Show summary
            const customerCount = await pool.query('SELECT COUNT(*) FROM customers');
            const affiliateCount = await pool.query('SELECT COUNT(*) FROM affiliates');
            const noteCount = await pool.query('SELECT COUNT(*) FROM customer_notes');
            
            const summary = {
              message: 'CSV data import completed successfully!',
              customers: parseInt(customerCount.rows[0].count),
              affiliates: parseInt(affiliateCount.rows[0].count),
              notes: parseInt(noteCount.rows[0].count)
            };

            if (!res.headersSent) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(summary));
            }
            
          } catch (error) {
            console.error('❌ CSV import failed:', error);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to import CSV data: ' + error.message }));
            }
          }
          return;
        }
      }

    } catch (error) {
      console.error('Server error:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const envLabel = isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION';
  console.log(`${envLabel} CRM Server running on port ${PORT}`);
  console.log('Database connected and ready');
  
  if (isDevelopment) {
    console.log(`🚀 Development server: http://localhost:${PORT}`);
    console.log(`📊 Dev Console: http://localhost:${PORT}/dev-console`);
  } else {
    console.log(`🚀 Production server: http://localhost:${PORT}`);
  }
});

// Force deployment restart
