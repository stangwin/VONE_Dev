const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');

const PostgresStore = connectPgSimple(session);

// Session configuration
function createSessionMiddleware(pool) {
  const isDevelopment = process.env.ENVIRONMENT === 'development';
  const tableName = isDevelopment ? 'session_dev' : 'session_prod';
  
  if (!pool) {
    console.log(`🔧 Session middleware: Using memory store for testing mode`);
    return session({
      secret: process.env.SESSION_SECRET || 'vantix-crm-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Testing mode - always allow HTTP
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'lax'
      },
      name: 'vantix.test.sid'
    });
  }
  
  console.log(`🔧 Session middleware: Using table "${tableName}" for ${isDevelopment ? 'development' : 'production'}`);
  
  return session({
    store: new PostgresStore({
      pool: pool,
      createTableIfMissing: true, // Auto-create session table in new environments
      tableName: tableName,
      schemaName: 'public' // Explicitly set schema
    }),
    secret: process.env.SESSION_SECRET || 'vantix-crm-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: !isDevelopment, // Only require HTTPS in production
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax' // More compatible than 'none', works for regular website usage
    },
    name: isDevelopment ? 'vantix.dev.sid' : 'vantix.sid',
    proxy: isDevelopment // Trust proxy headers in dev environment
  });
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Authentication required' }));
    return;
  }
  next();
}

// Check if user is authenticated (doesn't redirect)
function isAuthenticated(req) {
  const isAuth = req.session && req.session.userId;
  console.log('Auth check:', {
    hasSession: !!req.session,
    userId: req.session?.userId,
    userEmail: req.session?.user?.email,
    isAuthenticated: isAuth
  });
  return isAuth;
}

module.exports = {
  createSessionMiddleware,
  requireAuth,
  isAuthenticated
};