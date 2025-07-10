#!/bin/bash

echo "🔍 Current Environment Status"
echo "============================"

if [ -f ".env" ]; then
    echo "📄 .env file exists"
    
    if grep -q "DATABASE_URL_DEV" .env; then
        echo "🚧 Environment: DEVELOPMENT"
        echo "🗄️  Database: vantix_dev schema (isolated)"
        echo "🛠️  Features: Debug tools, dev console, test API keys"
        echo ""
        echo "📊 Database Configuration:"
        grep "DATABASE_URL_DEV" .env | sed 's/DATABASE_URL_DEV=/   Dev URL: /' | sed 's/npg_[^@]*@/***/g'
    else
        echo "🔒 Environment: PRODUCTION"
        echo "🗄️  Database: public schema (live data)"
        echo "🚫 Features: Production mode, no debug tools"
        echo ""
        echo "📊 Database Configuration:"
        echo "   Prod URL: Uses default DATABASE_URL from Replit secrets"
    fi
else
    echo "🔒 Environment: PRODUCTION (default)"
    echo "🗄️  Database: public schema (live data)"
    echo "🚫 Features: Production mode, no debug tools"
    echo ""
    echo "ℹ️  No .env file found - using production defaults"
fi

echo ""
echo "🔄 To switch environments:"
echo "   ./switch-to-development.sh  - Switch to development"
echo "   ./switch-to-production.sh   - Switch to production"
echo ""