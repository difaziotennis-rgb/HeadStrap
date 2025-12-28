# Where to Find Production Branch in Vercel

## Step-by-Step Instructions

### Step 1: Go to Vercel Dashboard
1. **Open**: https://vercel.com/dashboard
2. **Sign in** if needed

### Step 2: Select Your Project
1. **Click** on your project name (likely "difazio-tennis-booking" or similar)
2. This opens your project dashboard

### Step 3: Go to Settings
1. **Click** on the **"Settings"** tab at the top
   - It's usually next to "Deployments", "Analytics", etc.

### Step 4: Find Git Section
1. **Scroll down** in Settings
2. **Look for** a section called **"Git"** or **"Git Repository"**
   - It might be under "General" or as its own section

### Step 5: Check Production Branch
In the Git section, you should see:
- **Repository**: `difaziotennis-rgb/difazio-tennis-booking`
- **Production Branch**: Should say `main` (or `master`)

## Visual Guide

```
Vercel Dashboard
  └── Your Project
      └── Settings Tab
          └── Git Section
              ├── Repository: difaziotennis-rgb/difazio-tennis-booking
              └── Production Branch: main  ← THIS IS WHAT YOU'RE LOOKING FOR
```

## Alternative: Check in Deployments Tab

You can also see which branch is being deployed:

1. **Go to**: "Deployments" tab
2. **Look at** any deployment
3. **Check** the branch name shown next to the commit
   - Should say "main" or "master"

## If You Don't See Git Section

If there's no Git section in Settings, it means:
- ❌ Vercel is **not connected** to your GitHub repo
- You need to **connect it first**:
  1. In Settings, look for "Connect Git Repository" button
  2. Click it
  3. Select your GitHub repo
  4. Select `main` branch

## What It Should Look Like

**Correct Setup:**
```
Git Repository
Repository: difaziotennis-rgb/difazio-tennis-booking
Production Branch: main
```

**If Wrong:**
- Production Branch might say: `master` or something else
- **Fix**: Click "Edit" or "Change" and select `main`

## Quick Check

The fastest way to verify:
1. **Deployments** tab → Latest deployment
2. **Check** the branch name in the deployment card
3. Should say **"main"**





