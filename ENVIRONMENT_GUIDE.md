# Environment Management Guide

## Overview

The Vantix CRM supports complete separation between Development and Production environments using schema-based database isolation. This ensures Production data remains safe while allowing full development capabilities.

## Environment Architecture

### Production Environment
- **Database Schema**: `public` (default)
- **Environment**: Automatically detected when no `.env` file exists
- **Features**: Clean production interface, full security, live customer data
- **Access**: Direct via Replit with no development indicators

### Development Environment  
- **Database Schema**: `vantix_dev` (isolated)
- **Environment**: Activated via `.env` file with `DATABASE_URL_DEV`
- **Features**: Development banner, debug tools, dev console, test API keys
- **Access**: Requires authentication with development session handling

## Quick Commands

```bash
# Check current environment
./check-environment.sh

# Switch to development (isolated database)
./switch-to-development.sh

# Switch to production (live database)
./switch-to-production.sh

# View database sync status
node dev-database-sync.js
```

## Database Isolation Details

| Aspect | Production | Development |
|--------|------------|-------------|
| **Schema** | `public` | `vantix_dev` |
| **Data** | Live customer data (12+ customers) | Test data only (1 test customer) |
| **URL Pattern** | `DATABASE_URL` | `DATABASE_URL_DEV` with `schema=vantix_dev` |
| **Safety** | Protected from dev changes | Cannot affect production |

## Development Features

When in development mode, you get:
- 🚧 Red "DEV ENVIRONMENT" banner
- 🛠️ Debug dropdown menu in header
- 🔍 Development console at `/dev-console`
- 📊 Database comparison tools
- 🔄 Sync utilities (Dev → Prod)
- 🧪 Test API keys and sample data

## Database Synchronization

### Sync Tool Features
- **Production as Source of Truth**: Only Prod → Dev sync allowed
- **Manual Review Required**: No automatic sync operations
- **Selective Sync**: Choose specific records to sync
- **Safety Safeguards**: Multiple confirmation dialogs
- **Audit Trail**: Complete logging of all operations

### Running Sync Operations
```bash
# Compare databases and generate report
node dev-database-sync.js

# Access web interface
# Navigate to /dev-console → Database Comparison section
```

## Safety Measures

1. **Database Isolation**: Separate schemas prevent cross-contamination
2. **Environment Detection**: Automatic detection prevents accidental production access
3. **URL Validation**: Scripts validate database URLs and schema parameters
4. **Confirmation Dialogs**: Multiple approval steps for all sync operations
5. **Backup System**: Automated production backups before any operations

## Troubleshooting

### Environment Not Switching
- Ensure scripts have execute permissions: `chmod +x *.sh`
- Restart the server after switching: `npm run dev`
- Check `.env` file contents: `cat .env`

### Database Connection Issues
- Verify `DATABASE_URL` is set in Replit secrets
- Check schema parameter: `?schema=vantix_dev` for development
- Review server logs for connection errors

### Authentication Problems
- Development mode requires session tokens for iframe contexts
- Use test credentials: `test@test.com` / `test123`
- Check session debugging in server console

## File Structure

```
.env                      # Environment configuration (dev only)
.env.example             # Template for development setup
switch-to-production.sh  # Switch to production environment
switch-to-development.sh # Switch to development environment  
check-environment.sh     # Check current environment status
dev-database-sync.js     # Database synchronization tool
dev-console.html         # Development console interface
DATABASE_SYNC_GUIDE.md   # Detailed sync documentation
DEV_DATABASE_SETUP.md    # Development setup instructions
```

## Best Practices

1. **Always check environment** before making changes: `./check-environment.sh`
2. **Use development for testing** all new features and data changes
3. **Sync selectively** from Dev to Prod only after thorough testing
4. **Backup production** before any major sync operations
5. **Test authentication** in both environments to ensure compatibility

## Production Deployment

When ready for production:
1. Switch to production environment: `./switch-to-production.sh`
2. Restart server to apply changes
3. Verify production database connection
4. Deploy via Replit Deployments for automatic HTTPS and health monitoring

---

*This system provides complete environment isolation while maintaining Production as the permanent source of truth with comprehensive safety measures.*