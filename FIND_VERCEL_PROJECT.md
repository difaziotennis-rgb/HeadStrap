# How to Find the Right Vercel Project

## Quick Ways to Identify Your Project

### Method 1: Check the Domain

1. **Go to**: https://vercel.com/dashboard
2. **Look at** each project in your list
3. **Check** the "Domains" column or click into each project
4. **Find** the project that has: `difaziotennis.com`
5. **That's your project!**

### Method 2: Check Project Name

Your project is likely named one of these:
- `difazio-tennis-booking`
- `difazio-tennis`
- `difaziotennis`
- `tennis-booking`
- Something similar with "difazio" or "tennis"

### Method 3: Check Recent Deployments

1. **Go to**: https://vercel.com/dashboard
2. **Look at** each project's "Last Deployed" time
3. **Find** the one that was deployed most recently (since we've been pushing code)
4. **That's likely your project!**

### Method 4: Check the URL

1. **Go to**: https://difaziotennis.com
2. **Open** browser DevTools (F12)
3. **Go to** Network tab
4. **Refresh** the page
5. **Look** at the requests - they might show the Vercel project name

### Method 5: Check Vercel Project Settings

1. **Click** into each project
2. **Go to**: Settings → General
3. **Check** the "Project Name" and "Domains"
4. **Find** the one with `difaziotennis.com` domain

---

## What to Look For

### ✅ Correct Project Will Have:
- Domain: `difaziotennis.com` (or `www.difaziotennis.com`)
- Recent deployments (from our recent pushes)
- Project name containing "difazio" or "tennis"
- Framework: Next.js
- Environment variables might already have some keys (even if test keys)

### ❌ Wrong Projects Will Have:
- Different domains
- No recent deployments
- Different project names
- Different frameworks

---

## Still Not Sure?

### Option 1: Check All Projects
1. **Click** into each of the 5 projects
2. **Go to**: Settings → Environment Variables
3. **Look** for existing Stripe or PayPal keys
4. **The one** with existing payment keys is likely correct

### Option 2: Check Deployments
1. **Click** into each project
2. **Go to**: Deployments tab
3. **Check** the commit messages
4. **Find** one with recent commits like:
   - "Add Stripe verification endpoint"
   - "Fix build errors"
   - "Add debug logging"
   - Recent commits from today

### Option 3: Check Domain Settings
1. **Click** into each project
2. **Go to**: Settings → Domains
3. **Look** for `difaziotennis.com`
4. **That's your project!**

---

## Quick Test

Once you think you found the right project:

1. **Go to**: Settings → Environment Variables
2. **Check** if you see:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (even if it's test key)
   - `STRIPE_SECRET_KEY`
   - Or any other keys we've been working with
3. **If you see these**, that's the right project!

---

## If You Still Can't Find It

**Tell me:**
1. What are the names of your 5 projects?
2. What domains do they have?
3. Which one was most recently deployed?

I can help you identify which one is correct!

---

## After You Find It

Once you've identified the correct project:
1. **Go to**: Settings → Environment Variables
2. **Update** the Stripe keys (as per the live keys guide)
3. **Redeploy** without cache







