# How to Set Up Stripe Keys in Vercel - Step by Step

## Step 1: Get Your Stripe Keys

1. **Go to**: https://dashboard.stripe.com
2. **Login** to your Stripe account
3. **Click**: "Developers" (top right menu)
4. **Click**: "API keys" (left sidebar)
5. **You'll see two keys**:
   - **Publishable key** (starts with `pk_test_` for testing or `pk_live_` for production)
   - **Secret key** (starts with `sk_test_` for testing or `sk_live_` for production)
   - Click "Reveal test key" or "Reveal live key" to see the secret key

**Copy both keys** - you'll need them in the next step.

---

## Step 2: Go to Vercel Dashboard

1. **Go to**: https://vercel.com/dashboard
2. **Login** to your Vercel account
3. **Click** on your project: `difazio-tennis-booking` (or whatever it's named)

---

## Step 3: Navigate to Environment Variables

1. **Click**: "Settings" (left sidebar, under your project name)
2. **Click**: "Environment Variables" (under "Configuration" section)

---

## Step 4: Add/Update Stripe Keys

### Add First Key: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

1. **Click**: "Add New" button (top right)
2. **Key**: Type exactly: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - ⚠️ **Important**: Copy this exactly, including underscores and capitalization
3. **Value**: Paste your Stripe publishable key (starts with `pk_test_` or `pk_live_`)
4. **Environments**: Check ALL THREE boxes:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Click**: "Save"

### Add Second Key: STRIPE_SECRET_KEY

1. **Click**: "Add New" button again
2. **Key**: Type exactly: `STRIPE_SECRET_KEY`
   - ⚠️ **Important**: Copy this exactly, no `NEXT_PUBLIC_` prefix for the secret key
3. **Value**: Paste your Stripe secret key (starts with `sk_test_` or `sk_live_`)
4. **Environments**: Check ALL THREE boxes:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Click**: "Save"

---

## Step 5: Verify Keys Are Added

You should now see TWO environment variables in the list:

1. ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...` or `pk_live_...`
2. ✅ `STRIPE_SECRET_KEY` = `sk_test_...` or `sk_live_...`

Both should have all three environments checked (Production, Preview, Development).

---

## Step 6: Update Existing Keys (If They Already Exist)

If the keys already exist but aren't working:

1. **Find** the key in the list
2. **Click** on it (or click the "..." menu → "Edit")
3. **Update** the Value field with the correct key
4. **Verify** all three environments are checked:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Click**: "Save"

**OR** to completely reset:

1. **Click** the "..." menu next to the key
2. **Click**: "Delete"
3. **Add it again** using Step 4 above

---

## Step 7: Force Redeploy (CRITICAL!)

After adding/updating keys, you MUST redeploy:

1. **Go to**: "Deployments" tab (top menu)
2. **Find** the latest deployment
3. **Click**: "..." (three dots) on the right
4. **Click**: "Redeploy"
5. **IMPORTANT**: When you see "Use existing Build Cache"
   - **UNCHECK** this box ❌
   - This forces Vercel to rebuild with the new keys
6. **Click**: "Redeploy"
7. **Wait**: 3-5 minutes for the deployment to complete

---

## Step 8: Verify It's Working

1. **Wait** for deployment to finish (check the status in Deployments tab)
2. **Open** an Incognito/Private window (to avoid cache)
3. **Go to**: https://difaziotennis.com/book
4. **Select** a time slot → Fill form → Continue to Payment
5. **Click**: "Pay with Card" (Stripe button)
6. **Should**: Redirect to Stripe Checkout (not show an error)

---

## Troubleshooting

### Still seeing "Stripe is not configured"?

1. ✅ **Check key names are EXACT**:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (with `NEXT_PUBLIC_` prefix)
   - `STRIPE_SECRET_KEY` (NO `NEXT_PUBLIC_` prefix)

2. ✅ **Check all environments are checked**:
   - Production ✅
   - Preview ✅
   - Development ✅

3. ✅ **Redeploy without cache**:
   - Go to Deployments → Redeploy → Uncheck "Use existing Build Cache"

4. ✅ **Check keys start with correct prefix**:
   - Publishable: `pk_test_` or `pk_live_`
   - Secret: `sk_test_` or `sk_live_`

5. ✅ **Test in Incognito mode** (bypasses browser cache)

### Keys are correct but still not working?

1. **Check Vercel deployment logs**:
   - Go to Deployments → Click on latest deployment
   - Check "Build Logs" for any errors

2. **Verify keys in Stripe dashboard**:
   - Make sure you're using the correct keys (test vs live)
   - Make sure keys haven't been revoked

3. **Try deleting and re-adding**:
   - Delete both keys
   - Add them again from scratch
   - Redeploy without cache

---

## Quick Checklist

- [ ] Got Stripe keys from dashboard.stripe.com
- [ ] Added `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to Vercel
- [ ] Added `STRIPE_SECRET_KEY` to Vercel
- [ ] Both keys have all 3 environments checked (Production, Preview, Development)
- [ ] Redeployed without cache
- [ ] Tested in Incognito mode
- [ ] Stripe button works (redirects to checkout)

---

## Need Help?

If you're still having issues:
1. Check the browser console (F12) for error messages
2. Check Vercel deployment logs for build errors
3. Verify keys are correct in Stripe dashboard
4. Make sure you're testing in Incognito mode







