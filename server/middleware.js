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
      resave: true, // Force session save for memory store reliability
      saveUninitialized: false,
      rolling: true, // Reset expiration on activity
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
  
  const sessionStore = new PostgresStore({
    pool: pool,
    createTableIfMissing: true, // Auto-create session table in new environments
    tableName: tableName,
    schemaName: 'public' // Explicitly set schema
  });
  
  // Add debugging to session store
  const originalGet = sessionStore.get.bind(sessionStore);
  const originalSet = sessionStore.set.bind(sessionStore);
  
  sessionStore.get = function(sid, callback) {
    console.log(`🔍 Session GET: ${sid}`);
    originalGet(sid, (err, session) => {
      console.log(`🔍 Session GET result:`, { err: err?.message, session: session ? Object.keys(session) : null });
      callback(err, session);
    });
  };
  
  sessionStore.set = function(sid, session, callback) {
    console.log(`🔍 Session SET: ${sid}`, Object.keys(session));
    originalSet(sid, session, callback);
  };
  
  return session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'vantix-crm-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    cookie: {
      secure: !isDevelopment, // Secure in production, allow HTTP in development
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax' // More compatible than 'none', works for regular website usage
    },
    name: isDevelopment ? 'vantix.dev.sid' : 'vantix.sid',
    proxy: true // Always trust proxy headers for Render/cloud deployments
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