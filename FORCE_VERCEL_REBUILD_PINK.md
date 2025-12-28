# Force Vercel to Show Pink Background

## The Problem
Vercel has redeployed but you don't see the pink background. This is a **build cache issue**.

## Solution: Force Complete Rebuild (Do This Now)

### Step 1: Redeploy Without Cache

1. **Go to**: https://vercel.com/dashboard
2. **Click**: Your project name
3. **Go to**: "Deployments" tab
4. **Find**: The latest deployment (should be green/complete)
5. **Click**: "..." (three dots) on that deployment
6. **Click**: "Redeploy"
7. **CRITICAL**: When the popup appears, **UNCHECK** ✅ "Use existing Build Cache"
8. **Click**: "Redeploy"
9. **Wait**: 5-7 minutes for complete rebuild

### Step 2: Clear Browser Cache

**Option A: Hard Refresh**
- **Mac**: `Cmd + Shift + R`
- **Windows**: `Ctrl + Shift + R`

**Option B: Clear All Cache**
1. **Chrome/Edge**: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. **Time range**: "All time"
3. **Check**: ✅ Cached images and files
4. **Click**: "Clear data"

**Option C: Use Incognito Mode** (Easiest)
- **Chrome**: `Ctrl+Shift+N` or `Cmd+Shift+N`
- **Firefox**: `Ctrl+Shift+P` or `Cmd+Shift+P`
- **Safari**: `Cmd+Shift+N`

### Step 3: Verify Changes

1. **Wait** 5-7 minutes after redeploy
2. **Open** site in Incognito mode
3. **Check**: Background should be bright pink (#ff1493)

## What Changed

- ✅ Added `brightPink: '#ff1493'` to Tailwind config
- ✅ Changed all pages to use `bg-brightPink` class
- ✅ Removed inline styles (more reliable)
- ✅ Bumped version to 0.3.0

## If Still Not Working

### Check Vercel Build Logs:
1. **Go to**: Deployments tab
2. **Click**: Latest deployment
3. **Check**: "Build Logs"
4. **Look for**: Any errors or warnings
5. **Verify**: Build completed successfully

### Check GitHub:
1. **Go to**: https://github.com/difaziotennis-rgb/difazio-tennis-booking
2. **Verify**: Latest commit is "Switch to Tailwind classes for bright pink background"
3. **Check**: Files show `bg-brightPink` in the code

### Nuclear Option:
1. **Disconnect** GitHub repo from Vercel
2. **Reconnect** it
3. **Redeploy** (this forces a fresh build)

## Why This Happens

Vercel caches build artifacts to speed up deployments. When you change CSS/Tailwind config, the cache might not invalidate properly. Forcing a rebuild without cache ensures the new Tailwind classes are compiled.

## Summary

1. **Redeploy in Vercel** (UNCHECK "Use existing Build Cache") ← MOST IMPORTANT
2. **Wait 5-7 minutes** for rebuild
3. **Test in Incognito mode**
4. **Hard refresh** if needed

The code is correct - this is purely a caching issue!




