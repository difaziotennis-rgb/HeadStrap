# How to Set Up Venmo for Your Site

## ✅ Good News: Venmo is Already Built In!

Your site already has Venmo support! You just need to set up PayPal Business (which includes Venmo).

---

## How Venmo Works with Your Site

**Important**: Venmo for business payments is **only available through PayPal Business**. There's no separate Venmo business account.

When users click "PayPal or Venmo" on your site:
- They'll see both PayPal and Venmo buttons
- Venmo button appears automatically for US users
- Payments go through PayPal's system
- You receive money in your PayPal Business account

---

## Step-by-Step Setup

### Step 1: Create PayPal Business Account (15 minutes)

1. **Go to**: https://www.paypal.com/business
2. **Click**: "Sign Up" or "Get Started"
3. **Choose**: Business account
4. **Fill out**:
   - Business name: "DiFazio Tennis" (or your name)
   - Business type: **Individual/Sole Proprietor** (if you're a solo instructor)
   - Email: difaziotennis@gmail.com
   - Phone: 631-901-5220
5. **Verify** your email and phone
6. **Add bank account** (optional but recommended for faster payouts)

**Note**: PayPal Business accounts are **FREE** - no monthly fees!

### Step 2: Get PayPal API Credentials (10 minutes)

1. **Login** to your PayPal Business account
2. **Go to**: https://developer.paypal.com/dashboard
3. **Click**: "Create App" (or "My Apps & Credentials")
4. **Fill out**:
   - App Name: "DiFazio Tennis Booking"
   - Merchant: Your business account
   - Features: Checkout
5. **Click**: "Create App"
6. **Copy**:
   - **Client ID** (you'll see this immediately)
   - **Secret** (click "Show" to reveal it)

### Step 3: Enable Venmo in Your App (Automatic!)

**Good news**: Venmo is already enabled in your code! 

The code includes:
```javascript
"enable-funding": "venmo"
```

This means Venmo will automatically appear as an option when users pay.

### Step 4: Add Credentials to Vercel (5 minutes)

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

---

## How It Works

### For Your Customers:

1. Customer books a lesson
2. Clicks "PayPal or Venmo" button
3. Sees **both** PayPal and Venmo options
4. If they choose Venmo:
   - Opens Venmo app (if on mobile)
   - Or Venmo website (if on desktop)
   - They pay with their Venmo account
5. Payment completes
6. You receive money in your PayPal Business account

### For You:

- All payments (PayPal and Venmo) go to your PayPal Business account
- Same fees: 2.9% + $0.30 per transaction
- You can transfer to your bank account
- See all transactions in PayPal dashboard

---

## Venmo Requirements

- ✅ **US only**: Venmo is only available for US customers
- ✅ **Mobile-friendly**: Works best on mobile devices
- ✅ **Venmo account**: Customers need a Venmo account
- ✅ **PayPal Business**: You need PayPal Business (not personal)

---

## Testing Venmo

### Test Mode (Sandbox):

1. Use **sandbox credentials** from PayPal Developer Dashboard
2. Create test Venmo accounts in PayPal sandbox
3. Test payments (no real money)
4. Good for: Testing before going live

### Production Mode (Live):

1. Use **live credentials** from PayPal Business account
2. Real Venmo payments
3. Real money
4. Good for: When ready to accept payments

---

## Fees

- **Venmo**: 2.9% + $0.30 per transaction (same as PayPal)
- **Example**: $100 lesson = $3.20 fee, you receive $96.80

---

## Troubleshooting

### Venmo button doesn't appear?

1. **Check**: Is `enable-funding: "venmo"` in your code? ✅ (It is!)
2. **Check**: Are you using US-based PayPal account? (Required)
3. **Check**: Is customer in US? (Venmo is US-only)
4. **Check**: Are credentials added to Vercel?

### Payments not working?

1. **Check**: Environment variables in Vercel
2. **Check**: PayPal Business account is verified
3. **Check**: Bank account is added (for payouts)
4. **Check**: Vercel deployment logs for errors

---

## Quick Summary

1. ✅ **Create PayPal Business account** (free, ~15 min)
2. ✅ **Get API credentials** (~10 min)
3. ✅ **Add to Vercel** (~5 min)
4. ✅ **Venmo is automatically enabled!** (no extra steps)

**Total time**: ~30 minutes

---

## Need Help?

- PayPal Business Support: https://www.paypal.com/us/smarthelp
- PayPal Developer Docs: https://developer.paypal.com/docs
- Venmo for Business: https://www.paypal.com/us/business/accept-payments/venmo

Once you have your PayPal Business credentials, I can help you add them to Vercel!








