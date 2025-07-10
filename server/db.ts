import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

// Environment-aware database URL selection with strict isolation
const isDevelopment = process.env.ENVIRONMENT === 'development';
let databaseUrl;

if (isDevelopment) {
  // Development mode - Use development database/schema
  databaseUrl = process.env.DATABASE_URL_DEV;
  if (!databaseUrl) {
    console.error("❌ CONFIGURATION ERROR: DATABASE_URL_DEV is required in development mode");
    console.error("📝 Please create a separate development database and set DATABASE_URL_DEV");
    console.error("🔒 This prevents accidental connection to production database");
    throw new Error(
      "DATABASE_URL_DEV must be set in development mode. See DEV_DATABASE_SETUP.md for instructions."
    );
  }
  
  // Check for schema-based isolation
  const hasSchemaIsolation = databaseUrl.includes('schema=vantix_dev');
  const baseUrlsSame = databaseUrl.split('?')[0] === process.env.DATABASE_URL?.split('?')[0];
  
  if (baseUrlsSame && !hasSchemaIsolation) {
    throw new Error(
      "🚨 SAFETY VIOLATION: DATABASE_URL_DEV must use either separate database or vantix_dev schema"
    );
  }
  
  console.log('🔒 Drizzle using DEVELOPMENT database (isolated from production)');
  if (hasSchemaIsolation) {
    console.log('📍 Dev DB: Same host, using vantix_dev schema isolation');
  } else {
    console.log(`📍 Dev DB: ${databaseUrl.split('@')[1]?.split('?')[0]}`);
  }
} else {
  // Production mode - ONLY use production database (public schema)
  databaseUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL_PROD or DATABASE_URL must be set in production mode."
    );
  }
  console.log('🔒 Drizzle using PRODUCTION database');
  console.log(`📍 Prod DB: ${databaseUrl.split('@')[1]?.split('?')[0]} (public schema)`);
}

// Additional safety check to prevent cross-environment contamination
if (isDevelopment && databaseUrl.includes('prod')) {
  throw new Error(
    '🚨 SAFETY VIOLATION: Development mode cannot use production database URL. ' +
    'Database URL contains "prod" but environment is development.'
  );
}

// Create connection pool 
export const pool = new Pool({ connectionString: databaseUrl });

// Handle schema-based isolation for development
let dbInstance;
if (isDevelopment && databaseUrl.includes('schema=vantix_dev')) {
  console.log('🔧 Setting search_path to vantix_dev schema for development isolation');
  
  // Create wrapper that sets search_path before each query
  const wrappedPool = {
    query: async (text: string, params?: any[]) => {
      const client = await pool.connect();
      try {
        await client.query('SET search_path TO vantix_dev');
        const result = await client.query(text, params);
        return result;
      } finally {
        client.release();
      }
    }
  };
  
  dbInstance = drizzle({ client: wrappedPool as any, schema });
} else {
  dbInstance = drizzle({ client: pool, schema });
}

export const db = dbInstance;
