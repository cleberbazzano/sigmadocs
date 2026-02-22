#!/bin/sh
set -e

echo "🚀 Starting Sigma DOCs..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy || npx prisma db push --skip-generate

# Create default data if needed
echo "🔧 Checking default data..."

# Start the application
echo "✅ Starting server..."
exec "$@"
