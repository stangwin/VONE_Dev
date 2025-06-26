const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');

const PostgresStore = connectPgSimple(session);

// Session configuration
function createSessionMiddleware(pool) {
  return session({
    store: new PostgresStore({
      pool: pool,
      createTableIfMissing: true,
      tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'vantix-crm-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    },
    name: 'vantix.sid'
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