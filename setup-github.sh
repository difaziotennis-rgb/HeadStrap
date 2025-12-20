#!/bin/bash

# GitHub Setup Script
# This will initialize git and help you push to GitHub

echo "🚀 Setting up GitHub repository..."
echo ""

# Initialize git if not already
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
    git branch -M main
    echo "✅ Git initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if .gitignore exists
if [ ! -f .gitignore ]; then
    echo "⚠️  No .gitignore found - creating one..."
    cat > .gitignore << EOF
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
EOF
fi

echo ""
echo "📝 Staging files..."
git add .

echo ""
echo "💾 Creating initial commit..."
git commit -m "Initial commit: DiFazio Tennis Booking System" || {
    echo "⚠️  No changes to commit (or commit failed)"
}

echo ""
echo "✅ Local repository ready!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Name it: difazio-tennis-booking (or any name)"
echo "   - Don't initialize with README (we already have files)"
echo "   - Click 'Create repository'"
echo ""
echo "2. Copy the repository URL (looks like: https://github.com/YOUR_USERNAME/difazio-tennis-booking.git)"
echo ""
echo "3. Run these commands (replace YOUR_REPO_URL with your actual URL):"
echo ""
echo "   git remote add origin YOUR_REPO_URL"
echo "   git push -u origin main"
echo ""
echo "4. Then connect to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Click 'Add New Project'"
echo "   - Import your GitHub repository"
echo "   - Click 'Deploy'"
echo "   - Add your domain in settings"
echo ""
echo "🎉 That's it! Every time you push to GitHub, Vercel will auto-deploy!"

