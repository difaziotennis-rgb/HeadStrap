# PayPal & Venmo Payment Setup Guide

## ✅ Good News: The Code is Already Ready!

Your site already has PayPal and Venmo integration built in. You just need to:
1. Set up a PayPal Business account
2. Get your API credentials
3. Add them to Vercel environment variables

---

## Step-by-Step Setup

### Step 1: Create PayPal Business Account (15 minutes)

1. **Go to**: https://www.paypal.com/business
2. **Click**: "Sign Up" or "Get Started"
3. **Choose**: Business account
4. **Fill out**:
   - Business name: "DiFazio Tennis" (or your business name)
   - Business type: Individual/Sole Proprietor (or your type)
   - Business email: difaziotennis@gmail.com
   - Phone: 631-901-5220
5. **Verify** your email and phone
6. **Complete** business verification (may require bank account or business documents)

### Step 2: Get PayPal API Credentials (10 minutes)

1. **Login** to PayPal Business account
2. **Go to**: https://developer.paypal.com/dashboard
3. **Click**: "Create App" (or "My Apps & Credentials")
4. **Fill out**:
   - App Name: "DiFazio Tennis Booking"
   - Merchant: Your business account
   - Features: Checkout
5. **Click**: "Create App"
6. **Copy**:
   - **Client ID** (starts with `Ae...` or `AQ...`)
   - **Secret** (click "Show" to reveal)

### Step 3: Add Credentials to Vercel (5 minutes)

1. **Go to**: https://vercel.com/dashboard
2. **Click** your project: `difazio-tennis-booking`
3. **Go to**: Settings → Environment Variables
4. **Add these variables**:

   ```
   NEXT_PUBLIC_PAYPAL_CLIENT_ID = [Your Client ID from Step 2]
   PAYPAL_CLIENT_SECRET = [Your Secret from Step 2]
   ```

5. **Select environment**: Production (and Preview if you want)
6. **Click**: "Save"
7. **Redeploy**: Go to Deployments → Click "..." → "Redeploy"

### Step 4: Update API Route for Production (I'll do this)

The API route is currently set to sandbox mode. I'll update it to work with both sandbox (testing) and production.

---

## Testing vs Production

### Testing Mode (Sandbox)
- Use sandbox credentials from PayPal Developer Dashboard
- Test with fake PayPal accounts
- No real money changes hands
- Good for: Testing before going live

### Production Mode (Live)
- Use live credentials from PayPal Business account
- Real payments, real money
- Good for: When you're ready to accept real payments

**Recommendation**: Start with sandbox to test, then switch to production when ready.

---

## Venmo Setup

**Good news**: Venmo is automatically included with PayPal! 

- No separate setup needed
- When users click "PayPal or Venmo", they'll see both options
- Venmo button appears automatically for US users
- Same fees as PayPal (2.9% + $0.30 per transaction)

---

## Fees

- **PayPal**: 2.9% + $0.30 per transaction
- **Venmo**: 2.9% + $0.30 per transaction (same as PayPal)
- **Example**: $100 lesson = $3.20 fee, you receive $96.80

---

## What Happens After Setup

1. ✅ Users can click "PayPal or Venmo" button
2. ✅ They'll see both PayPal and Venmo options
3. ✅ Payment processes through PayPal
4. ✅ You receive money in your PayPal Business account
5. ✅ Booking is marked as "paid" in your system

---

## Next Steps

1. **Set up PayPal Business account** (Step 1 above)
2. **Get API credentials** (Step 2 above)
3. **Add to Vercel** (Step 3 above)
4. **Tell me when done** - I'll update the API route if needed
5. **Test** with a small payment
6. **Go live!**

---

## Need Help?

- PayPal Business Support: https://www.paypal.com/us/smarthelp
- PayPal Developer Docs: https://developer.paypal.com/docs
- Venmo for Business: https://www.paypal.com/us/business/accept-payments/venmo

Let me know when you have your PayPal credentials and I'll help you add them!

