# How to Update Your Site

## 🔄 Update Workflow (Simple!)

### Step 1: Make Changes Locally
Edit files in `/Users/derek/Public` using any editor (VS Code, Cursor, etc.)

### Step 2: Test Locally (Optional but Recommended)
```bash
cd /Users/derek/Public
npm run dev
```
Visit http://localhost:3000 to test your changes

### Step 3: Commit Changes
```bash
cd /Users/derek/Public
git add .
git commit -m "Description of your changes"
```

### Step 4: Push to GitHub
```bash
git push origin main
```

### Step 5: Vercel Auto-Deploys! 🚀
- Vercel automatically detects the push
- Builds your site (takes 2-3 minutes)
- Deploys to production
- Your site updates live!

## 📝 Example Workflow

Let's say you want to change the homepage text:

1. **Edit the file**: `app/page.tsx`
2. **Test locally**:
   ```bash
   npm run dev
   ```
3. **Commit**:
   ```bash
   git add app/page.tsx
   git commit -m "Update homepage text"
   ```
4. **Push**:
   ```bash
   git push origin main
   ```
5. **Wait 2-3 minutes** - Vercel deploys automatically!
6. **Check your site**: https://difaziotennis.com

## 🎯 Quick Commands Reference

```bash
# Start local dev server
npm run dev

# See what files changed
git status

# Add all changes
git add .

# Commit with message
git commit -m "Your change description"

# Push to GitHub (triggers auto-deploy)
git push origin main

# Check deployment status
# (Go to https://vercel.com/dashboard)
```

## 🔍 Check Deployment Status

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Go to "Deployments" tab
4. See latest deployment status:
   - ✅ "Ready" = Live!
   - 🔄 "Building" = In progress
   - ❌ "Error" = Something went wrong

## 💡 Tips

- **Always test locally first** with `npm run dev`
- **Write clear commit messages** so you know what changed
- **Check Vercel dashboard** if deployment fails
- **Environment variables** are set in Vercel, not in code

## 🆘 If Something Goes Wrong

1. Check Vercel deployment logs
2. Test locally to see if error is in your code
3. Check git status to see what changed
4. You can revert: `git revert HEAD` then push

That's it! Super simple workflow. 🎉








