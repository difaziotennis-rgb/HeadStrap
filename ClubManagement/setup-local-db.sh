#!/bin/bash

# Setup script for local PostgreSQL database for EliteClub OS
# This script assumes PostgreSQL is installed and running

set -e

echo "🗄️  Setting up local PostgreSQL database for EliteClub OS"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    echo ""
    echo "Please install PostgreSQL first:"
    echo ""
    echo "Option 1: Install via Homebrew (recommended):"
    echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo "  brew install postgresql@14"
    echo "  brew services start postgresql@14"
    echo ""
    echo "Option 2: Download from https://www.postgresql.org/download/macosx/"
    echo ""
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost &> /dev/null; then
    echo "⚠️  PostgreSQL doesn't appear to be running"
    echo "Starting PostgreSQL..."
    
    # Try to start PostgreSQL (Homebrew)
    if command -v brew &> /dev/null; then
        brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
        sleep 2
    fi
    
    if ! pg_isready -h localhost &> /dev/null; then
        echo "❌ Could not start PostgreSQL. Please start it manually."
        exit 1
    fi
fi

echo "✅ PostgreSQL is running"
echo ""

# Create database
echo "📦 Creating database 'clubmanagement'..."
psql -U postgres -c "CREATE DATABASE clubmanagement;" 2>/dev/null || \
psql -d postgres -c "CREATE DATABASE clubmanagement;" 2>/dev/null || {
    echo "⚠️  Database might already exist, continuing..."
}

echo "✅ Database created"
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Update .env.local if needed
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clubmanagement?schema=public"
EOF
    echo "✅ Created .env.local"
else
    echo "✅ .env.local already exists"
fi

echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Push database schema
echo "📊 Pushing database schema..."
npx prisma db push --accept-data-loss

echo ""
echo "✅ Database setup complete!"
echo ""
echo "You can now run: npm run dev"
echo ""


