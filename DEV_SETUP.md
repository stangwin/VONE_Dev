# 🔧 Development Environment Setup Guide

## Overview
This guide explains how to create a separate Development environment for Vantix CRM by cloning this project.

## 🚀 Quick Setup Steps

### 1. Clone/Fork this Replit Project
- **Fork** this Replit project to create your Dev environment
- **Important**: Keep this original project as your Production environment

### 2. In Your Cloned Project: Create Environment File
```bash
cp .env.example .env
```

### 3. Verify Dev Environment is Active
After copying the .env file, restart the server and verify:

**✅ Visual Indicators You Should See:**
- Red banner at top: "🚧 DEV ENVIRONMENT 🚧"
- Browser title: "[DEV] Vantix CRM"
- Server logs: "Environment: DEVELOPMENT"

### 4. Optional: Add Your Test API Keys
Edit the `.env` file with your development API keys:
```bash
# Replace with your actual test keys
OPENAI_API_KEY=sk-test-your-actual-dev-key
QUICKBOOKS_CLIENT_ID=your-test-qbo-id
# etc...
```

### 5. Optional: Use Separate Dev Database
To completely isolate dev data, add a separate database URL:
```bash
DATABASE_URL=your-separate-dev-database-url
```

## 🎯 Environment Comparison

| Feature | Production (Original) | Development (Clone) |
|---------|----------------------|---------------------|
| **Visual Indicators** | Clean interface | Red "DEV ENVIRONMENT" banner |
| **Browser Title** | "Vantix CRM" | "[DEV] Vantix CRM" |
| **Database** | Production PostgreSQL | Same by default, optional separate |
| **API Keys** | Production keys | Test keys from .env |
| **Server Logs** | "Environment: PRODUCTION" | "Environment: DEVELOPMENT" |
| **Test Mode** | Available | Available (independent feature) |

## 🔍 Verification Checklist

After setting up your dev environment:

**✅ Must See These Indicators:**
1. Red banner at top of all pages: "🚧 DEV ENVIRONMENT 🚧"
2. Browser tab title: "[DEV] Vantix CRM"
3. Server logs: "Environment: DEVELOPMENT"
4. API endpoint `/api/environment` returns: `"environment": "development"`

**❌ Production Environment Stays Clean:**
- No banners or development indicators
- Standard "Vantix CRM" title
- Server logs: "Environment: PRODUCTION"

## 🛠️ Data Isolation Options

### Option 1: Shared Database (Default)
- Both environments use same PostgreSQL database
- Use **Test Mode** toggle to prevent saving test data
- Good for: Testing features without affecting real data

### Option 2: Separate Database (REQUIRED for Full Isolation)
- **REQUIRED**: Set `DATABASE_URL_DEV` and `DATABASE_URL_PROD` in dev .env file
- Complete data isolation between environments
- **Safety**: Development can NEVER access production database
- Good for: Extensive testing, data experiments, complete environment separation

### 🔒 Database Isolation Safety Features:
- Development mode **requires** `DATABASE_URL_DEV` (will exit if missing)
- Production mode **requires** `DATABASE_URL_PROD` (or fallback to `DATABASE_URL`)
- Cross-environment safety checks prevent accidental database mixing
- URL validation prevents dev mode from using production database URLsa experiments

## 🚨 Troubleshooting

### Dev Banner Not Appearing
1. Verify `.env` file exists in cloned project
2. Check `ENVIRONMENT=development` is set
3. Restart the server
4. Clear browser cache and reload

### Environment Detection Failed
1. Check server logs for "Environment: DEVELOPMENT" 
2. Test `/api/environment` endpoint directly
3. Verify .env file format and syntax

### Still Seeing Production Mode
1. Ensure you're in the **cloned** project, not original
2. Confirm .env file is in root directory
3. Check file permissions and encoding