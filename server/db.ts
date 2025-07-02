import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

// Environment-aware database URL selection
const isDevelopment = process.env.ENVIRONMENT === 'development';
let databaseUrl;

if (isDevelopment) {
  // Development mode - ONLY use development database
  databaseUrl = process.env.DATABASE_URL_DEV;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL_DEV must be set in development mode. This prevents accidental connection to production database."
    );
  }
  console.log('🔒 Drizzle using DEVELOPMENT database (isolated from production)');
} else {
  // Production mode - ONLY use production database
  databaseUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL_PROD or DATABASE_URL must be set in production mode."
    );
  }
  console.log('🔒 Drizzle using PRODUCTION database');
}

// Additional safety check to prevent cross-environment contamination
if (isDevelopment && databaseUrl.includes('prod')) {
  throw new Error(
    '🚨 SAFETY VIOLATION: Development mode cannot use production database URL. ' +
    'Database URL contains "prod" but environment is development.'
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
