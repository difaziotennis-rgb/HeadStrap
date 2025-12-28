#!/bin/bash

# Complete Automated Deployment - Does Everything Possible
# You'll only need to click "Authorize" in browsers a few times

set -e

echo "🚀 COMPLETE AUTOMATED DEPLOYMENT"
echo "================================"
echo ""
echo "This script will:"
echo "✅ Set up git repository"
echo "✅ Create GitHub repository"
echo "✅ Push your code"
echo "✅ Deploy to Vercel"
echo ""
echo "You'll need to:"
echo "  - Click 'Authorize' in browser (2-3 times)"
echo "  - Add your domain in Vercel dashboard"
echo ""
read -p "Press Enter to start..."

# Step 1: Configure Git
echo ""
echo "📝 Step 1: Configuring Git..."
if [ -z "$(git config --global user.name 2>/dev/null)" ]; then
    echo "Git needs your name and email for commits."
    read -p "Your name: " GIT_NAME
    read -p "Your email: " GIT_EMAIL
    git config --global user.name "$GIT_NAME"
    git config --global user.email "$GIT_EMAIL"
fi
echo "✅ Git configured"

# Step 2: Install GitHub CLI if needed
echo ""
echo "📦 Step 2: Checking GitHub CLI..."
if ! command -v gh &> /dev/null; then
    echo "Installing GitHub CLI..."
    
    # Try Homebrew first
    if command -v brew &> /dev/null; then
        brew install gh
    else
        # Try direct download for macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "Downloading GitHub CLI for macOS..."
            GH_VERSION="2.40.1"
            curl -L "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_macOS_amd64.tar.gz" -o /tmp/gh.tar.gz
            tar -xzf /tmp/gh.tar.gz -C /tmp
            sudo mv /tmp/gh_${GH_VERSION}_macOS_amd64/bin/gh /usr/local/bin/gh || {
                echo "⚠️  Could not install to /usr/local/bin. Trying ~/.local/bin..."
                mkdir -p ~/.local/bin
                mv /tmp/gh_${GH_VERSION}_macOS_amd64/bin/gh ~/.local/bin/gh
                export PATH="$HOME/.local/bin:$PATH"
            }
            rm -rf /tmp/gh_${GH_VERSION}_macOS_amd64 /tmp/gh.tar.gz
        else
            echo "❌ Please install GitHub CLI manually: https://cli.github.com/"
            exit 1
        fi
    fi
fi

echo "✅ GitHub CLI ready"

# Step 3: Login to GitHub
echo ""
echo "🔐 Step 3: GitHub Authentication"
echo "A browser will open - please click 'Authorize'"
read -p "Press Enter to open GitHub login..."
gh auth login --web

# Step 4: Create and push to GitHub
echo ""
echo "📦 Step 4: Creating GitHub Repository..."
REPO_NAME="difazio-tennis-booking"

# Check if repo already exists
if gh repo view "$REPO_NAME" &>/dev/null; then
    echo "Repository already exists. Using existing repo..."
    gh repo set-default "$REPO_NAME"
else
    echo "Creating new repository: $REPO_NAME"
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
fi

REPO_URL=$(gh repo view "$REPO_NAME" --json url -q .url)
echo "✅ Repository created: $REPO_URL"

# Step 5: Deploy to Vercel
echo ""
echo "🌐 Step 5: Deploying to Vercel"
echo "A browser will open - please click 'Authorize'"
read -p "Press Enter to start Vercel deployment..."

if command -v vercel &> /dev/null; then
    vercel login
    vercel --prod
else
    echo "Using npx vercel..."
    npx vercel login
    npx vercel --prod
fi

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📋 Final Steps (in Vercel Dashboard):"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click your project"
echo "3. Settings > Domains > Add:"
echo "   - difaziotennis.com"
echo "   - www.difaziotennis.com"
echo "4. Settings > Environment Variables > Add all from .env.local"
echo "5. Redeploy"
echo ""
echo "🎉 Your site will be live at https://difaziotennis.com!"








