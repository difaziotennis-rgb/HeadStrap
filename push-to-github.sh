#!/bin/bash

# Quick script to push to GitHub after you create the repo

echo "📦 Ready to push to GitHub!"
echo ""
echo "After you create the repo at https://github.com/new:"
echo ""
read -p "Enter your GitHub username: " GITHUB_USER
read -p "Enter the repo name (or press Enter for 'difazio-tennis-booking'): " REPO_NAME

REPO_NAME=${REPO_NAME:-difazio-tennis-booking}

echo ""
echo "Adding remote and pushing..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
git branch -M main
git push -u origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo "Repository: https://github.com/${GITHUB_USER}/${REPO_NAME}"








