#!/bin/bash

# Switch to Production Environment
echo "🔄 Switching to Production Environment..."

# Clear any existing .env file
rm -f .env

# Create production .env configuration
cat > .env << EOF
NODE_ENV=production
# Production uses the default DATABASE_URL (no _DEV suffix)
# Schema: public (default)
EOF

echo ""
echo "✅ Switched to Production Environment"
echo "🔒 Database: Production (public schema)"
echo "🚫 Development features disabled"
echo ""
echo "🔄 Restart the server to apply changes:"
echo "   npm run dev"
echo ""