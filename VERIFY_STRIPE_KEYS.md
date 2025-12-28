# How to Verify Stripe Keys Are Working

Since the verification endpoint might not be deployed yet, here are **3 ways to verify** your Stripe keys:

## Method 1: Test the Payment Button (Easiest)

1. **Wait 2-3 minutes** after adding keys in Vercel (for deployment to complete)
2. **Open Incognito/Private window** (to avoid cache)
3. **Go to**: https://difaziotennis.com/book
4. **Select** a time slot → Fill form → Continue to Payment
5. **Open browser console** (F12 → Console tab)
6. **Click** "Pay with Card" button
7. **Check console output**:
   - ✅ **If you see**: `🔍 Stripe Debug: { hasKey: true, keyPrefix: "pk_test_..." }`
   - ✅ **If button redirects** to Stripe Checkout → **Keys are working!**
   - ❌ **If you see**: `hasKey: false` → Keys not loaded
   - ❌ **If you see error message** → Check the error

## Method 2: Check Vercel Environment Variables

1. **Go to**: https://vercel.com/dashboard
2. **Select**: Your project
3. **Click**: Settings → Environment Variables
4. **Verify** you see:
   - ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...` or `pk_live_...`
   - ✅ `STRIPE_SECRET_KEY` = `sk_test_...` or `sk_live_...`
   - ✅ Both have all 3 environments checked (Production, Preview, Development)

## Method 3: Check Browser Console (After Redeploy)

1. **Make sure** you redeployed after adding keys:
   - Go to Vercel → Deployments → Click "..." → Redeploy
   - **Uncheck** "Use existing Build Cache"
2. **Wait** for deployment to finish
3. **Open** https://difaziotennis.com/book in Incognito mode
4. **Open Console** (F12)
5. **Look for** the Stripe debug message when you click the payment button

## What Success Looks Like

### ✅ Keys Are Working:
- Console shows: `hasKey: true`
- Button shows: "Pay with Card" (blue button, no error)
- Clicking redirects to Stripe Checkout page
- You can enter test card: `4242 4242 4242 4242`

### ❌ Keys Not Working:
- Console shows: `hasKey: false`
- Button shows: "⚠️ Stripe Not Configured" error message
- Clicking does nothing or shows error

## Common Issues

### Issue: "hasKey: false" in console
**Solution**: 
- Keys not set in Vercel, or
- Not redeployed after adding keys, or
- Keys not checked for all environments

### Issue: Button shows error message
**Solution**:
- Check key names are EXACT: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`
- Make sure publishable key starts with `pk_test_` or `pk_live_`
- Redeploy without cache

### Issue: Redirects but payment fails
**Solution**:
- Check secret key is correct (starts with `sk_test_` or `sk_live_`)
- Make sure both keys are from the same Stripe account
- Make sure both keys are test OR both are live (don't mix)

## Quick Test Card (Stripe Test Mode)

If using test keys (`pk_test_`), use these test cards:
- **Card**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

## Still Not Working?

1. **Double-check** key names in Vercel (copy/paste exactly)
2. **Verify** all 3 environments are checked
3. **Redeploy** without cache
4. **Test** in Incognito mode
5. **Check** browser console for errors







