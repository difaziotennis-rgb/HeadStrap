#!/bin/bash

# Automated Deployment Script
# This will help you deploy to Vercel with minimal steps

echo "🚀 Automated Deployment Setup"
echo "=============================="
echo ""

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel 2>/dev/null || {
        echo "⚠️  Global install failed. Using npx instead..."
        USE_NPX=true
    }
fi

echo ""
echo "🔐 Step 1: Authentication"
echo "You'll need to login to Vercel (opens browser)"
echo ""
read -p "Press Enter to continue with login..."

if [ "$USE_NPX" = true ]; then
    npx vercel login
else
    vercel login
fi

echo ""
echo "📦 Step 2: Building project..."
npm run build

echo ""
echo "🚀 Step 3: Deploying to Vercel..."
echo "When prompted:"
echo "  - Set up and deploy? Yes"
echo "  - Which scope? (select your account)"
echo "  - Link to existing project? No (first time)"
echo "  - Project name? difazio-tennis-booking"
echo "  - Directory? ./"
echo ""

if [ "$USE_NPX" = true ]; then
    npx vercel --prod
else
    vercel --prod
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings > Domains"
echo "4. Add: difaziotennis.com and www.difaziotennis.com"
echo "5. Add your environment variables in Settings > Environment Variables"
echo ""

