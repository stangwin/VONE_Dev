# Development Database Setup Guide

## Required: Create Separate Development Database

To properly separate Development and Production environments, you need to create a new database:

### Option 1: Neon Database (Recommended)
1. Go to https://neon.tech/
2. Create a new project named "vantix-dev"
3. Create database named "vantix_dev"
4. Copy the connection string

### Option 2: Other PostgreSQL Providers
- Supabase: https://supabase.com/
- Railway: https://railway.app/
- AWS RDS, Google Cloud SQL, etc.

## Required Connection String Format
```
DATABASE_URL_DEV=postgresql://<user>:<password>@<host>/vantix_dev?sslmode=require
```

## Environment Configuration
Add to `.env` file:
```
ENVIRONMENT=development
DATABASE_URL_DEV=postgresql://your_dev_connection_string_here
OPENAI_API_KEY=sk-test-key-for-development
```

## Current Status
- ✅ Production backup created: `production_backup_20250710_021414.sql`
- ✅ Environment logic configured in `server/db.ts`
- ⚠️  Need actual separate dev database connection string
- ⚠️  Currently using mock dev URL for demonstration

## Next Steps
1. Create real development database
2. Update DATABASE_URL_DEV with real connection string
3. Run database migrations on dev database
4. Test isolation between environments