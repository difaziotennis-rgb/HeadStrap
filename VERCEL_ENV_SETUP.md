# Vercel Environment Variables Setup

## For Stripe (REQUIRED)

1. **Go to**: https://vercel.com/dashboard
2. **Select**: Your project (`difazio-tennis-booking` or similar)
3. **Click**: "Settings" (left sidebar)
4. **Click**: "Environment Variables" (under Configuration)

### Add These Two Variables:

#### 1. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- **Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Value**: Your Stripe publishable key (starts with `pk_test_` or `pk_live_`)
- **Environments**: ✅ Check all three:
  - Production
  - Preview  
  - Development

#### 2. STRIPE_SECRET_KEY
- **Name**: `STRIPE_SECRET_KEY`
- **Value**: Your Stripe secret key (starts with `sk_test_` or `sk_live_`)
- **Environments**: ✅ Check all three:
  - Production
  - Preview
  - Development

### After Adding:

1. **Click "Save"** for each variable
2. **Go to**: Deployments tab
3. **Click**: "..." (three dots) on latest deployment
4. **Click**: "Redeploy"
5. **IMPORTANT**: Uncheck "Use existing Build Cache"
6. **Click**: "Redeploy"
7. **Wait**: 3-5 minutes for rebuild

## For PayPal (NOT NEEDED)

**You do NOT need to add any PayPal environment variables!**

PayPal uses hardcoded configuration in `lib/payment-config.ts`:
- PayPal.me username: `difaziotennis`
- PayPal email: `difaziotennis@gmail.com`

If you see an error about `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, it means:
- The site is using cached/old code
- You need to redeploy without cache (see steps above)

## How to Get Stripe Keys

1. **Go to**: https://dashboard.stripe.com
2. **Click**: "Developers" → "API keys"
3. **Copy**:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

**Note**: Use `test` keys for testing, `live` keys for production.

## Verify Keys Are Set

After redeploying, test in **Incognito/Private mode**:
1. Open Incognito window
2. Go to: https://difaziotennis.com/book
3. Select a time slot → Fill form → Continue
4. Click "Pay with Card" (Stripe)
5. Should redirect to Stripe Checkout (not show error)

## Troubleshooting

### Still seeing "Stripe is not configured"?
- ✅ Keys are added in Vercel
- ✅ All three environments checked (Production, Preview, Development)
- ✅ Redeployed without cache
- ✅ Tested in Incognito mode
- ✅ Keys start with `pk_` and `sk_`

### Still seeing PayPal error?
- The site is using cached code
- Force redeploy without cache
- Clear browser cache completely
- Test in Incognito mode

