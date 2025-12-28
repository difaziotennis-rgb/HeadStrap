# Stripe Credit Card Payment Setup

## Quick Setup (5 minutes)

Stripe is already integrated into your site! You just need to add your API keys.

## Step 1: Create Stripe Account

1. **Go to**: https://stripe.com
2. **Sign up** with your email: `difaziotennis@gmail.com`
3. **Complete** the account setup (no business account needed!)

## Step 2: Get Your API Keys

1. **After signing up**, go to: https://dashboard.stripe.com/test/apikeys
2. **You'll see two keys**:
   - **Publishable key** (starts with `pk_test_...` or `pk_live_...`)
   - **Secret key** (starts with `sk_test_...` or `sk_live_...`)

3. **Copy both keys**

## Step 3: Add Keys to Vercel

1. **Go to**: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. **Add these two variables**:

   **Variable 1:**
   - **Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Value**: `pk_test_...` (your publishable key)
   - **Environment**: Production, Preview, Development (check all)

   **Variable 2:**
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: `sk_test_...` (your secret key)
   - **Environment**: Production, Preview, Development (check all)

3. **Click**: "Save"

## Step 4: Redeploy

After adding the keys:
1. **Go to**: Vercel Dashboard → Your Project → Deployments
2. **Click**: "Redeploy" on the latest deployment
3. **Or**: Just push a new commit (it will auto-deploy)

## Test vs Live Keys

### Test Mode (Recommended to start)
- Use `pk_test_...` and `sk_test_...` keys
- Test with card: `4242 4242 4242 4242`
- No real charges

### Live Mode (When ready)
- Switch to `pk_live_...` and `sk_live_...` keys in Stripe dashboard
- Update environment variables in Vercel
- Real payments will be processed

## How It Works

Once configured:
1. User selects "Credit or Debit Card" payment method
2. Clicks "Pay with Card"
3. Redirects to Stripe Checkout (secure payment page)
4. User enters card details
5. Payment processed by Stripe
6. User redirected back to your site
7. Booking confirmed automatically

## Fees

- **Stripe fees**: 2.9% + $0.30 per transaction
- **Example**: $160 lesson = $4.94 fee, you receive $155.06

## Security

- Stripe handles all card data (PCI compliant)
- You never see or store card numbers
- Secure and trusted by millions of businesses

## Need Help?

If you run into issues:
1. Check Vercel logs for errors
2. Make sure both keys are added (publishable AND secret)
3. Make sure keys match (both test or both live)
4. Redeploy after adding keys

That's it! Once you add the keys, credit card payments will work automatically! 🎉







