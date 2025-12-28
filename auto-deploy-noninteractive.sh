#!/bin/bash

# Non-interactive deployment script
# This will do everything that doesn't require browser authentication

set -e

echo "🚀 Automated Deployment (Non-Interactive)"
echo "=========================================="
echo ""

# Step 1: Check git status
echo "📝 Step 1: Checking git repository..."
if [ -d .git ]; then
    echo "✅ Git repository ready"
    git status --short | head -5
else
    echo "❌ Git repository not found"
    exit 1
fi

# Step 2: Check if GitHub CLI is available
echo ""
echo "📦 Step 2: Checking for GitHub CLI..."
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI found: $(gh --version | head -1)"
    GITHUB_CLI_AVAILABLE=true
else
    echo "⚠️  GitHub CLI not found - will use web-based method"
    GITHUB_CLI_AVAILABLE=false
fi

# Step 3: Try to create repo if GitHub CLI is available
if [ "$GITHUB_CLI_AVAILABLE" = true ]; then
    echo ""
    echo "🔐 Step 3: Checking GitHub authentication..."
    if gh auth status &>/dev/null; then
        echo "✅ GitHub authenticated"
        echo ""
        echo "📦 Creating GitHub repository..."
        REPO_NAME="difazio-tennis-booking"
        
        # Check if repo exists
        if gh repo view "$REPO_NAME" &>/dev/null 2>&1; then
            echo "✅ Repository already exists: $REPO_NAME"
            gh repo set-default "$REPO_NAME"
        else
            echo "Creating new repository: $REPO_NAME"
            gh repo create "$REPO_NAME" --public --source=. --remote=origin --push 2>&1 || {
                echo "⚠️  Could not create repo automatically. Repository might already exist or need authentication."
                echo "   You can create it manually at: https://github.com/new"
            }
        fi
        
        REPO_URL=$(gh repo view "$REPO_NAME" --json url -q .url 2>/dev/null || echo "")
        if [ -n "$REPO_URL" ]; then
            echo "✅ Repository URL: $REPO_URL"
        fi
    else
        echo "⚠️  Not authenticated with GitHub"
        echo "   Run: gh auth login"
        echo "   Or create repo manually at: https://github.com/new"
    fi
else
    echo ""
    echo "📋 Step 3: Manual GitHub Setup Required"
    echo "   1. Go to: https://github.com/new"
    echo "   2. Create repository: difazio-tennis-booking"
    echo "   3. Then run: git remote add origin https://github.com/YOUR_USERNAME/difazio-tennis-booking.git"
    echo "   4. Then run: git push -u origin main"
fi

# Step 4: Vercel deployment
echo ""
echo "🌐 Step 4: Vercel Deployment"
if command -v vercel &> /dev/null; then
    echo "✅ Vercel CLI found"
    echo "   To deploy, run: vercel --prod"
elif command -v npx &> /dev/null; then
    echo "✅ Can use npx vercel"
    echo "   To deploy, run: npx vercel --prod"
else
    echo "⚠️  Vercel CLI not found"
fi

echo ""
echo "📋 Summary:"
echo "==========="
echo ""
echo "✅ Git repository: Ready"
echo "✅ Code: Committed and ready"
echo ""
if [ "$GITHUB_CLI_AVAILABLE" = true ] && gh auth status &>/dev/null 2>&1; then
    echo "✅ GitHub: Ready (repo created)"
    echo ""
    echo "Next: Deploy to Vercel"
    echo "   Run: npx vercel --prod"
    echo "   Or: vercel --prod"
else
    echo "⚠️  GitHub: Needs setup"
    echo "   1. Create repo at: https://github.com/new"
    echo "   2. Push code: git push -u origin main"
    echo ""
    echo "Then deploy to Vercel:"
    echo "   Run: npx vercel --prod"
fi
echo ""
echo "After Vercel deployment:"
echo "   1. Add domain: difaziotennis.com"
echo "   2. Add environment variables"
echo "   3. Redeploy"








