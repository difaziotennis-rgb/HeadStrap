#!/bin/bash

# Full Automated Deployment Script
# This will do everything possible automatically

set -e

echo "🚀 Full Automated Deployment"
echo "============================"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "📦 Installing GitHub CLI..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install gh
        else
            echo "⚠️  Homebrew not found. Please install GitHub CLI manually:"
            echo "   brew install gh"
            echo "   Or download from: https://cli.github.com/"
            exit 1
        fi
    else
        echo "⚠️  Please install GitHub CLI manually from: https://cli.github.com/"
        exit 1
    fi
fi

echo "✅ GitHub CLI installed"
echo ""

# Configure git if not already configured
if [ -z "$(git config --global user.name)" ]; then
    echo "⚙️  Configuring git..."
    read -p "Enter your name for git commits: " GIT_NAME
    read -p "Enter your email for git commits: " GIT_EMAIL
    git config --global user.name "$GIT_NAME"
    git config --global user.email "$GIT_EMAIL"
    echo "✅ Git configured"
else
    echo "✅ Git already configured"
fi

echo ""
echo "🔐 Step 1: GitHub Authentication"
echo "You'll need to login to GitHub (this will open your browser)"
echo ""
read -p "Press Enter to continue with GitHub login..."

gh auth login --web

echo ""
echo "📦 Step 2: Creating GitHub Repository"
REPO_NAME="difazio-tennis-booking"
echo "Creating repository: $REPO_NAME"

# Create the repository
gh repo create "$REPO_NAME" --public --source=. --remote=origin --push

echo ""
echo "✅ Repository created and code pushed!"
echo ""

# Get the repository URL
REPO_URL=$(gh repo view --json url -q .url)
echo "📍 Repository URL: $REPO_URL"
echo ""

echo "🌐 Step 3: Deploying to Vercel"
echo ""
echo "Now we'll deploy to Vercel. You'll need to:"
echo "1. Login to Vercel (browser will open)"
echo "2. Authorize the deployment"
echo ""

read -p "Press Enter to continue with Vercel deployment..."

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel 2>/dev/null || {
        echo "Using npx instead..."
        npx vercel login
        npx vercel --prod
    }
else
    vercel login
    vercel --prod
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Final Steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings > Domains"
echo "4. Add: difaziotennis.com and www.difaziotennis.com"
echo "5. Add your environment variables in Settings > Environment Variables"
echo ""
echo "🎉 Your site will be live at https://difaziotennis.com!"

