# Fix Payment Errors - Troubleshooting Guide

## The Problem

You're seeing:
- **PayPal**: "PayPal is not configured. Please add NEXT_PUBLIC_PAYPAL_CLIENT_ID..."
- **Stripe**: "Stripe is not configured. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY..."

## Why This Is Happening

### PayPal Error
The error message mentions `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, but we're using `PayPalPersonalPayment` which doesn't need that. This suggests:
- **The site hasn't been redeployed** with the new code
- **Browser cache** is showing old code
- **Build cache** issue

### Stripe Error
The error is correct - it needs `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Even though you added it to Vercel:
- **The site hasn't been redeployed** after adding keys
- **Keys aren't set for the right environment** (Production/Preview/Development)
- **Build cache** issue

## Solution Steps

### Step 1: Force Redeploy in Vercel

1. **Go to**: https://vercel.com/dashboard
2. **Select**: Your project (difazio-tennis-booking)
3. **Go to**: Deployments tab
4. **Click**: "Redeploy" on the latest deployment
5. **Or**: Push a new commit (I just pushed one - wait 2-3 minutes)

### Step 2: Clear Browser Cache

**Chrome/Edge:**
- Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Select "Cached images and files"
- Click "Clear data"
- Or: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) for hard refresh

**Firefox:**
- Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Select "Cache"
- Click "Clear Now"
- Or: `Ctrl+F5` for hard refresh

**Safari:**
- Press `Cmd+Option+E` to clear cache
- Or: `Cmd+Option+R` for hard refresh

### Step 3: Verify Environment Variables in Vercel

1. **Go to**: Vercel Dashboard → Your Project → Settings → Environment Variables
2. **Check**:
   - ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` exists
   - ✅ `STRIPE_SECRET_KEY` exists
   - ✅ Both are checked for: Production, Preview, Development
3. **If missing**: Add them and redeploy

### Step 4: Wait for Deployment

After redeploying:
- Wait 2-3 minutes for deployment to complete
- Check Vercel dashboard for deployment status
- Once "Ready", try again

### Step 5: Test Again

1. **Hard refresh** your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`)
2. **Go to**: https://difaziotennis.com/book
3. **Select** a time slot → Fill form → Continue to Payment
4. **Test**:
   - PayPal: Should show PayPal.me link (no error)
   - Stripe: Should show "Pay with Card" button (no error)

## Quick Fix - Force New Deployment

I just pushed a fix. To trigger a new deployment:

```bash
# Or just wait - Vercel auto-deploys on push
```

The new code is already pushed. Just:
1. **Wait 2-3 minutes** for Vercel to deploy
2. **Hard refresh** your browser
3. **Test again**

## If Still Not Working

### Check Vercel Logs:
1. Go to: Vercel Dashboard → Your Project → Logs
2. Look for errors related to PayPal or Stripe
3. Check if environment variables are being read

### Verify Keys Are Correct:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` should start with `pk_test_` or `pk_live_`
- `STRIPE_SECRET_KEY` should start with `sk_test_` or `sk_live_`

### Check Build Output:
1. Go to: Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Check "Build Logs" for any errors

## Expected Behavior After Fix

✅ **PayPal**: Should show "Pay with PayPal" button (opens paypal.me/difaziotennis)
✅ **Stripe**: Should show "Pay with Card" button (redirects to Stripe Checkout)
✅ **Venmo**: Should show "Pay with Venmo" button (opens Venmo)

All three should work without any "not configured" errors!







