# Stripe Integration Verification

## ✅ Stripe Keys Should Be in Vercel

Since you've added the Stripe keys to Vercel, let's verify everything is set up correctly.

## Environment Variables Required in Vercel

Make sure these are set in Vercel (Settings → Environment Variables):

1. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
   - Value: `pk_test_...` (test) or `pk_live_...` (live)
   - Environments: Production, Preview, Development (check all)

2. **STRIPE_SECRET_KEY**
   - Value: `sk_test_...` (test) or `sk_live_...` (live)
   - Environments: Production, Preview, Development (check all)

3. **NEXT_PUBLIC_BASE_URL** (for redirects)
   - Value: `https://difaziotennis.com`
   - Environments: Production, Preview, Development (check all)

## How to Verify Stripe is Working

### 1. Check the Button Appears
- Go to: https://difaziotennis.com/book
- Select a time slot
- Fill out the form
- Click "Continue to Payment"
- Select "Credit or Debit Card"
- The "Pay with Card" button should appear (not an error message)

### 2. Test the Payment Flow
- Click "Pay with Card"
- You should be redirected to Stripe Checkout
- If you see an error, check the browser console (F12)

### 3. Test with Test Card
- Use test card: `4242 4242 4242 4242`
- Any future expiry date (e.g., 12/25)
- Any CVC (e.g., 123)
- Any ZIP code

## Common Issues

### Issue: "Stripe is not configured" error
**Solution:**
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set in Vercel
- Make sure it's checked for all environments
- Redeploy after adding the key

### Issue: "Stripe is not configured" in API
**Solution:**
- Verify `STRIPE_SECRET_KEY` is set in Vercel
- Make sure it's checked for all environments
- Redeploy after adding the key

### Issue: Redirect doesn't work
**Solution:**
- Verify `NEXT_PUBLIC_BASE_URL` is set to `https://difaziotennis.com`
- Check that the success/cancel URLs are correct

### Issue: Payment succeeds but booking not confirmed
**Solution:**
- Check browser console for errors
- Verify booking is created before Stripe redirect
- Check that success page is receiving the booking ID

## Testing Checklist

- [ ] Stripe keys added to Vercel
- [ ] Keys checked for all environments (Production, Preview, Development)
- [ ] Site redeployed after adding keys
- [ ] "Pay with Card" button appears (no error)
- [ ] Clicking button redirects to Stripe Checkout
- [ ] Test payment with test card works
- [ ] Redirect back to success page works
- [ ] Booking is confirmed after payment

## If Still Not Working

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for errors related to Stripe

2. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for errors when clicking "Pay with Card"

3. **Verify Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Make sure both keys are there
   - Make sure they're checked for the correct environment

4. **Redeploy:**
   - After adding/updating keys, trigger a new deployment
   - Or just push a new commit to trigger auto-deploy

## Code Status

✅ Stripe integration code is correct and ready
✅ All components are properly configured
✅ API routes are set up correctly
✅ Redirect URLs are configured

The code is ready - it just needs the environment variables to be properly set in Vercel!







