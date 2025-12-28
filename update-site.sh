#!/bin/bash

# Quick script to update your site

echo "🔄 Updating DiFazio Tennis Site"
echo "================================"
echo ""

# Check for changes
if [ -z "$(git status --porcelain)" ]; then
    echo "⚠️  No changes to commit"
    exit 0
fi

# Show what changed
echo "📝 Changes detected:"
git status --short
echo ""

# Ask for commit message
read -p "Enter commit message: " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update site"
fi

# Commit and push
echo ""
echo "💾 Committing changes..."
git add .
git commit -m "$COMMIT_MSG"

echo ""
echo "🚀 Pushing to GitHub (triggers Vercel auto-deploy)..."
git push origin main

echo ""
echo "✅ Done! Vercel will deploy in 2-3 minutes"
echo "Check status at: https://vercel.com/dashboard"
