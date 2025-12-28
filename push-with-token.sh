#!/bin/bash

# Script to push to GitHub using a Personal Access Token

echo "🔐 GitHub Push with Token"
echo "========================"
echo ""
echo "I've opened the GitHub token creation page in Chrome."
echo ""
echo "Steps:"
echo "1. On the GitHub page, give the token a name: 'Vercel Deploy'"
echo "2. Set expiration (30 days or 90 days is fine)"
echo "3. Check the 'repo' scope (this gives access to repositories)"
echo "4. Scroll down and click 'Generate token'"
echo "5. COPY THE TOKEN (you won't see it again!)"
echo ""
read -p "Press Enter after you've copied your token..."

read -sp "Paste your token here: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ No token provided"
    exit 1
fi

echo ""
echo "📦 Pushing to GitHub..."
cd /Users/derek/Public

# Update remote URL to include token
git remote set-url origin "https://${GITHUB_TOKEN}@github.com/difaziotennis-rgb/difazio-tennis-booking.git"

# Push
git push origin main

echo ""
echo "✅ Done! Your code is now on GitHub!"
echo ""
echo "Now go back to Vercel and try importing the repository again!"








