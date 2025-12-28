# Payment Debugging Guide - Only Venmo Works

## Current Status
- ✅ **Venmo**: Working
- ❌ **PayPal**: Not working
- ❌ **Stripe**: Not working

## Step 1: Check What Error You're Seeing

### For PayPal:
1. **Go to**: https://difaziotennis.com/book
2. **Select** time slot → Fill form → Continue
3. **Click**: "Pay with PayPal"
4. **What do you see?**
   - Error message? (What does it say?)
   - Nothing happens?
   - Button doesn't appear?

### For Stripe:
1. **Go to**: https://difaziotennis.com/book
2. **Select** time slot → Fill form → Continue
3. **Click**: "Pay with Card"
4. **What do you see?**
   - Error message? (What does it say?)
   - Nothing happens?
   - Button doesn't appear?

## Step 2: Check Browser Console

1. **Open** browser DevTools (F12)
2. **Go to**: Console tab
3. **Click** on PayPal or Stripe button
4. **Look for** error messages or debug logs

### What to Look For:

**PayPal:**
- Should see: `🔍 PayPalPersonalPayment v2.0: { paypalMeUsername: "difaziotennis", ... }`
- If you see errors, note them down

**Stripe:**
- Should see: `🔍 Stripe Debug: { hasKey: true, keyPrefix: "pk_live_..." }`
- If `hasKey: false`, keys aren't loaded
- If you see errors, note them down

## Step 3: Check Vercel Environment Variables

1. **Go to**: https://vercel.com/dashboard
2. **Select**: Your project (difazio-tennis-booking)
3. **Go to**: Settings → Environment Variables

### For PayPal:
- **You should NOT need any PayPal environment variables**
- PayPal uses hardcoded config in `lib/payment-config.ts`

### For Stripe:
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (or `pk_test_...`)
- ✅ `STRIPE_SECRET_KEY` = `sk_live_...` (or `sk_test_...`)
- ✅ Both checked for: Production, Preview, Development

## Step 4: Common Issues & Fixes

### PayPal Not Working

**Issue 1: Still seeing "NEXT_PUBLIC_PAYPAL_CLIENT_ID" error**
- **Cause**: Old cached code
- **Fix**: 
  1. Go to Vercel → Deployments → Redeploy
  2. **Uncheck** "Use existing Build Cache"
  3. Wait 3-5 minutes
  4. Test in Incognito mode

**Issue 2: Button shows error about configuration**
- **Cause**: PayPal config not loading
- **Fix**: Check `lib/payment-config.ts` has:
  - `paypalMeUsername: "difaziotennis"`
  - `paypalEmail: "difaziotennis@gmail.com"`

**Issue 3: Nothing happens when clicking**
- **Cause**: JavaScript error
- **Fix**: Check browser console for errors

### Stripe Not Working

**Issue 1: "Stripe is not configured" error**
- **Cause**: Keys not set or not loaded
- **Fix**:
  1. Verify keys in Vercel (see Step 3)
  2. Redeploy without cache
  3. Test in Incognito mode

**Issue 2: Console shows `hasKey: false`**
- **Cause**: Keys not loaded in frontend
- **Fix**:
  1. Check key name is EXACT: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  2. Check all 3 environments are checked
  3. Redeploy without cache

**Issue 3: Redirects but payment fails**
- **Cause**: Secret key issue
- **Fix**:
  1. Check `STRIPE_SECRET_KEY` is set correctly
  2. Make sure both keys are from same account (both live or both test)
  3. Check Stripe dashboard for errors

## Step 5: Force Complete Rebuild

If nothing works, force a complete rebuild:

1. **Go to**: Vercel → Your Project → Deployments
2. **Click**: "..." → "Redeploy"
3. **Uncheck**: "Use existing Build Cache" ❌
4. **Click**: "Redeploy"
5. **Wait**: 5 minutes
6. **Test** in Incognito mode

## Step 6: Test Each Payment Method

### Test Venmo (Should Work):
1. Click "Pay with Venmo"
2. Should open Venmo link
3. ✅ This works, so the payment modal is functioning

### Test PayPal:
1. Click "Pay with PayPal"
2. **Check console** for debug message
3. **Check** if button appears or error shows
4. **Note** what happens

### Test Stripe:
1. Click "Pay with Card"
2. **Check console** for debug message
3. **Check** if button appears or error shows
4. **Note** what happens

## Step 7: Share Debug Info

Please share:
1. **PayPal**: What error/behavior do you see?
2. **Stripe**: What error/behavior do you see?
3. **Console errors**: Any errors in browser console?
4. **Vercel keys**: Are Stripe keys set correctly?
5. **Recent deployment**: Did you redeploy after adding keys?

## Quick Checklist

- [ ] Tested in Incognito mode
- [ ] Checked browser console (F12)
- [ ] Verified Stripe keys in Vercel
- [ ] Redeployed without cache
- [ ] Checked for error messages
- [ ] Noted what happens when clicking each button







