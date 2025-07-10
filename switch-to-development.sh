#!/bin/bash

# Switch to Development Environment
echo "🔄 Switching to Development Environment..."

# Clear any existing .env file
rm -f .env

# Get the base production URL and create development URL with schema parameter
BASE_URL="${DATABASE_URL}"
if [ -z "$BASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not found"
    echo "   Please ensure DATABASE_URL is set in your Replit secrets"
    exit 1
fi

# Create development .env configuration
cat > .env << EOF
NODE_ENV=development
DATABASE_URL_DEV=${BASE_URL}?sslmode=require&schema=vantix_dev
OPENAI_API_KEY=sk-test-key-for-development
EOF

echo ""
echo "✅ Switched to Development Environment"
echo "🚧 Database: Development (vantix_dev schema)"
echo "🛠️  Development features enabled"
echo "🔍 Debug tools available"
echo ""
echo "🔄 Restart the server to apply changes:"
echo "   npm run dev"
echo ""