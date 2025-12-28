# How Auto-Deploy Works

## ✅ Yes! Pushing to Main Auto-Deploys

If Vercel is connected to your GitHub repository, **every push to `main` automatically triggers a new deployment**.

## How It Works

1. **You push code** to GitHub (`git push origin main`)
2. **Vercel detects** the push (via GitHub webhook)
3. **Vercel automatically** starts building and deploying
4. **No manual action needed!**

## What Happens

- ✅ Code pushed to GitHub
- ✅ Vercel automatically builds
- ✅ Vercel automatically deploys
- ✅ Site updates in 2-5 minutes

## Check Deployment Status

1. **Go to**: https://vercel.com/dashboard
2. **Select**: Your project
3. **Go to**: Deployments tab
4. **See**: Latest deployment (should show "Building" or "Ready")

## When You Need Manual Redeploy

You only need to manually redeploy if:
- ❌ Vercel isn't connected to GitHub
- ❌ You want to redeploy an old commit
- ❌ You want to clear build cache (uncheck "Use existing Build Cache")

## Current Status

I just pushed the payment button redesign to `main`, so:
- ✅ Vercel should automatically start building
- ✅ Check Deployments tab in 1-2 minutes
- ✅ Should see new deployment starting

No manual redeploy needed! 🎉







