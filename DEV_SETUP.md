# Development Environment Setup Guide

## Overview
This guide explains how to set up the Development environment for Vantix CRM after cloning the project.

## Quick Setup Steps

### 1. Clone this Replit Project
- Fork or clone this Replit project to create your Dev environment

### 2. Create Environment File
```bash
cp .env.example .env
```

### 3. Edit the .env file
```bash
# Set this to enable Dev environment
ENVIRONMENT=development

# Add your test API keys
OPENAI_API_KEY=sk-test-your-dev-openai-key-here
QUICKBOOKS_CLIENT_ID=test-qbo-client-id
QUICKBOOKS_CLIENT_SECRET=test-qbo-client-secret
DOCUSIGN_CLIENT_ID=test-docusign-client-id
DOCUSIGN_CLIENT_SECRET=test-docusign-client-secret

# Optional: Use separate dev database
# DATABASE_URL=your-dev-database-url-here

# Development session secret
SESSION_SECRET=dev-session-secret-change-in-production
```

### 4. Restart the Server
Click the restart button or run:
```bash
node server.js
```

## What Changes in Dev Environment

### Visual Indicators
- ✅ Red banner at top: "🚧 DEV ENVIRONMENT 🚧"
- ✅ Browser title shows "[DEV] Vantix CRM"
- ✅ All pages show development indicators

### Data Isolation
- 🔄 Uses same PostgreSQL database by default
- 🔧 **Optional**: Set custom DATABASE_URL in .env for separate dev database
- ✅ Test Mode toggle still functions independently

### API Configuration
- ✅ Uses test API keys from .env file
- ✅ Development-specific logging and debugging
- ✅ Environment endpoint available at `/api/environment`

## Verification

After setup, verify:
1. **UI**: Red dev banner appears at top of all pages
2. **Title**: Browser tab shows "[DEV] Vantix CRM"
3. **API**: Visit `/api/environment` - should show `"environment": "development"`
4. **Health**: Visit `/health` - should show development environment

## Production Environment

The original project remains unchanged:
- ❌ No dev banners or labels
- ❌ Standard "Vantix CRM" title
- ✅ Uses production database and API keys
- ✅ All existing functionality preserved

## Test Mode vs Dev Environment

- **Test Mode**: Prevents saving data to database (works in both Prod and Dev)
- **Dev Environment**: Separate configuration and visual indicators
- Both can be used together for maximum safety during development

## Troubleshooting

### Dev Banner Not Showing
1. Ensure `.env` file exists with `ENVIRONMENT=development`
2. Restart the server
3. Clear browser cache

### Still Using Prod Data
1. Check `.env` file is properly configured
2. Verify environment endpoint shows development
3. Consider setting separate DATABASE_URL for dev

### API Keys Not Working
1. Verify test API keys are properly set in `.env`
2. Check console for authentication errors
3. Ensure keys have proper permissions for testing