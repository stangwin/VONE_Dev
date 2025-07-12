# Dual Environment Setup Guide

## Overview
You can now run both Production and Development environments simultaneously for safe testing and development.

## Environment Configuration

### Production Environment
- **URL**: Your current Replit domain (port 5000)
- **Database**: Production PostgreSQL (`public` schema)
- **Features**: Clean production interface, no development tools
- **Session Table**: `session_prod`

### Development Environment  
- **URL**: Add `:3000` to your Replit domain (port 3000)
- **Database**: Development PostgreSQL (`vantix_dev` schema)
- **Features**: Red dev banner, development console, debug tools
- **Session Table**: `session_dev`

## How to Access Both

### Production Access
1. Use your normal Replit URL: `https://your-repl-domain.replit.dev`
2. This runs on port 5000 and connects to production data
3. Login with your production credentials

### Development Access
1. Use your Replit URL with port 3000: `https://your-repl-domain.replit.dev:3000`
2. This runs on port 3000 and connects to development schema
3. Login with development credentials: `test@test.com` / `test123`
4. Access dev console at: `https://your-repl-domain.replit.dev:3000/dev-console`

## Database Isolation
- **Complete Schema Separation**: Production (`public`) and Development (`vantix_dev`)
- **Zero Risk**: Development changes cannot affect production data
- **Safe Testing**: Test VONE v1.3 features without production impact

## Workflow Benefits
- **Real-time Production**: Continue business operations on port 5000
- **Safe Development**: Test new features on port 3000
- **Instant Comparison**: Switch between tabs to compare environments
- **Data Sync**: Sync production data to development when needed

## VONE v1.3 Development
All v1.3 "Foundation & Flow" features are being developed in the development environment only.