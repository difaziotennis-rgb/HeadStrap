# How to Switch to Live Stripe Keys

## ⚠️ Important Before Switching

**Live keys will charge REAL MONEY!** Make sure:
- ✅ Your site is fully tested with test keys
- ✅ Payment flow works correctly
- ✅ You're ready to accept real payments
- ✅ You understand Stripe's fees (2.9% + $0.30 per transaction)

---

## Step 1: Get Live Keys from Stripe

1. **Go to**: https://dashboard.stripe.com
2. **Login** to your Stripe account
3. **Click**: "Developers" (top right menu)
4. **Click**: "API keys" (left sidebar)
5. **Toggle**: Switch from "Test mode" to **"Live mode"** (toggle in top right)
   - The toggle should say "Live mode" (not "Test mode")
6. **You'll see two NEW keys**:
   - **Publishable key** (starts with `pk_live_...`)
   - **Secret key** (starts with `sk_live_...`)
   - Click "Reveal live key" to see the secret key
7. **Copy both keys** - you'll need them in the next step

---

## Step 2: Update Keys in Vercel

1. **Go to**: https://vercel.com/dashboard
2. **Click** on your project: `difazio-tennis-booking`
3. **Click**: "Settings" (left sidebar)
4. **Click**: "Environment Variables" (under Configuration)

### Update Publishable Key

1. **Find**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in the list
2. **Click** on it (or click "..." → "Edit")
3. **Replace** the value with your **live publishable key** (`pk_live_...`)
4. **Verify** all 3 environments are checked:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Click**: "Save"

### Update Secret Key

1. **Find**: `STRIPE_SECRET_KEY` in the list
2. **Click** on it (or click "..." → "Edit")
3. **Replace** the value with your **live secret key** (`sk_live_...`)
4. **Verify** all 3 environments are checked:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Click**: "Save"

---

## Step 3: Verify Keys Are Updated

In Vercel Environment Variables, you should see:

1. ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (NOT `pk_test_`)
2. ✅ `STRIPE_SECRET_KEY` = `sk_live_...` (NOT `sk_test_`)
3. ✅ Both have all 3 environments checked

---

## Step 4: Force Redeploy (CRITICAL!)

After updating keys, you MUST redeploy:

1. **Go to**: "Deployments" tab (top menu)
2. **Find** the latest deployment
3. **Click**: "..." (three dots) on the right
4. **Click**: "Redeploy"
5. **IMPORTANT**: When you see "Use existing Build Cache"
   - **UNCHECK** this box ❌
   - This forces Vercel to rebuild with the new live keys
6. **Click**: "Redeploy"
7. **Wait**: 3-5 minutes for deployment to complete

---

## Step 5: Verify Live Keys Are Working

1. **Wait** for deployment to finish
2. **Open** an Incognito/Private window
3. **Go to**: https://difaziotennis.com/book
4. **Open** browser console (F12 → Console tab)
5. **Select** a time slot → Fill form → Continue to Payment
6. **Click**: "Pay with Card"
7. **Check console**:
   - Should show: `keyPrefix: "pk_live_..."`
   - Should redirect to Stripe Checkout
8. **Test with a real card** (small amount first!)

---

## ⚠️ Important Warnings

### Before Going Live:

1. **Test thoroughly** with test keys first
2. **Verify** payment flow works end-to-end
3. **Check** email notifications work
4. **Confirm** booking creation works
5. **Test** the success page redirect

### After Going Live:

1. **Monitor** Stripe dashboard for payments
2. **Check** email notifications are received
3. **Verify** bookings are created correctly
4. **Test** with a small real payment first
5. **Keep** test keys for future testing

---

## Stripe Fees

When using live keys, Stripe charges:
- **2.9%** + **$0.30** per successful transaction
- Example: $160 lesson = $4.94 fee, you receive $155.06

---

## Rollback Plan (If Needed)

If you need to switch back to test keys:

1. **Go to**: Vercel → Environment Variables
2. **Update** both keys back to test keys (`pk_test_` / `sk_test_`)
3. **Redeploy** without cache
4. **Test** to verify

---

## Quick Checklist

- [ ] Got live keys from Stripe dashboard (Live mode)
- [ ] Updated `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `pk_live_...`
- [ ] Updated `STRIPE_SECRET_KEY` to `sk_live_...`
- [ ] Both keys have all 3 environments checked
- [ ] Redeployed without cache
- [ ] Verified keys show `pk_live_` in console
- [ ] Tested with small real payment
- [ ] Verified booking creation works
- [ ] Verified email notifications work

---

## Need Help?

If you run into issues:
1. Check Stripe dashboard → Payments (to see if payments are coming through)
2. Check Vercel deployment logs for errors
3. Verify keys are correct in Vercel
4. Test in Incognito mode to avoid cache

**You're now ready to accept real payments!** 💳

