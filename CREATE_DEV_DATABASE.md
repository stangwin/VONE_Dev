# Create Development Database on Neon

## Required Action: Create Separate Neon Database

**Current Setup**: Production uses Neon database `ep-wispy-wildflower-a5f7fzvx`

**Next Steps:**
1. Go to https://console.neon.tech/
2. Create a new project named "vantix-crm-dev" 
3. Or add a new database to existing project named "vantix_dev"
4. Copy the connection string

**Expected Format:**
```
postgresql://neondb_owner:[password]@ep-[dev-endpoint].us-east-2.aws.neon.tech/vantix_dev?sslmode=require
```

**Alternative: Create via Neon CLI (if available):**
```bash
# Install Neon CLI if not available
npm install -g @neondatabase/cli

# Create new database
neon databases create vantix_dev

# Get connection string
neon connection-string vantix_dev
```

Once you have the connection string, update the .env file with:
```
DATABASE_URL_DEV=postgresql://[your_new_connection_string]
```