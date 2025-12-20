#!/bin/bash

# Deployment script for difaziotennis.com
# This script builds your Next.js app and prepares it for deployment

echo "🚀 Building Next.js application..."
npm run build

echo "✅ Build complete!"
echo ""
echo "📦 Your app is ready to deploy."
echo ""
echo "Next steps depend on your hosting:"
echo ""
echo "1. If using Vercel/Netlify:"
echo "   - Push to GitHub/GitLab and connect to your hosting platform"
echo "   - Or use: npx vercel --prod"
echo ""
echo "2. If you have SSH access to your server:"
echo "   - Upload the entire project folder"
echo "   - Run: npm install --production"
echo "   - Run: npm run build"
echo "   - Run: npm start (or use PM2)"
echo ""
echo "3. If you have FTP/cPanel:"
echo "   - Next.js requires Node.js hosting (not traditional shared hosting)"
echo "   - Consider Vercel (free) or a VPS"
echo ""
echo "📝 Don't forget to set environment variables on your hosting platform!"

