# Stripe Payment Flow - How It Works

## ✅ Setup Complete

Your Stripe integration is ready! Here's how it works:

## Payment Flow

1. **User selects time slot** → Fills out form → Clicks "Continue to Payment"
2. **Payment modal opens** → User selects "Credit or Debit Card"
3. **User clicks "Pay with Card"**:
   - Booking is created (status: "pending")
   - User is redirected to Stripe Checkout
4. **User pays on Stripe**:
   - Enters card details on Stripe's secure page
   - Payment is processed by Stripe
5. **Stripe redirects back**:
   - Returns to: `/booking-success?id={bookingId}&payment=success`
   - Booking status updated to "confirmed" and "paid"
   - Time slot marked as booked
   - Email notification sent
6. **Success page shows**:
   - Confirmation message
   - Booking details
   - Payment confirmed

## What You Need

Make sure you've added to Vercel:
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...` or `pk_live_...`
- ✅ `STRIPE_SECRET_KEY` = `sk_test_...` or `sk_live_...`

## Testing

### Test Mode (Recommended to start)
- Use test keys (`pk_test_...` and `sk_test_...`)
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC
- No real charges

### Live Mode (When ready)
- Switch to live keys in Stripe dashboard
- Update environment variables in Vercel
- Real payments will be processed

## How to Test

1. Go to: https://difaziotennis.com/book
2. Select a time slot
3. Fill out form
4. Click "Continue to Payment"
5. Select "Credit or Debit Card"
6. Click "Pay with Card"
7. You should be redirected to Stripe Checkout
8. Use test card: `4242 4242 4242 4242`
9. Complete payment
10. You'll be redirected back with confirmation

## Troubleshooting

**If "Pay with Card" doesn't work:**
- Check Vercel logs for errors
- Verify both Stripe keys are added
- Make sure keys match (both test or both live)
- Redeploy after adding keys

**If redirect doesn't work:**
- Check that `NEXT_PUBLIC_BASE_URL` is set correctly in Vercel
- Should be: `https://difaziotennis.com`

## Payment Methods Summary

✅ **Venmo**: `6319015220` (hardcoded, ready)
✅ **PayPal**: `paypal.me/difaziotennis` (hardcoded, ready)
✅ **Stripe**: Credit cards (needs API keys in Vercel)

All payment info is hardcoded - no admin login needed!







