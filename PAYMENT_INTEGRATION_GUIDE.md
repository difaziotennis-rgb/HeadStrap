# Payment Integration Guide

## Overview

This guide covers integrating PayPal, Venmo, and credit card payments into your tennis booking system.

## Payment Options

### 1. **PayPal** ✅ Easiest
- **Setup Time:** ~30 minutes
- **Cost:** 2.9% + $0.30 per transaction
- **Requirements:** PayPal Business account
- **Pros:** Easy setup, widely trusted, handles both PayPal and credit cards
- **Cons:** Higher fees than Stripe

### 2. **Venmo** ✅ Easy (via PayPal)
- **Setup Time:** Included with PayPal setup
- **Cost:** Same as PayPal (2.9% + $0.30)
- **Requirements:** PayPal Business account (Venmo is included)
- **Pros:** Popular with younger users, easy to use
- **Cons:** Only available in US

### 3. **Credit Cards (Stripe)** ⭐ Recommended for Credit Cards
- **Setup Time:** ~45 minutes
- **Cost:** 2.9% + $0.30 per transaction (same as PayPal)
- **Requirements:** Stripe account
- **Pros:** Lower fees for larger transactions, better developer experience, more payment methods
- **Cons:** Slightly more complex setup

### 4. **Credit Cards (via PayPal)**
- **Setup Time:** Included with PayPal
- **Cost:** Same as PayPal
- **Requirements:** PayPal Business account
- **Pros:** One account for everything
- **Cons:** Less flexible than Stripe

## Recommended Approach

**Option A: PayPal Only (Easiest)**
- Use PayPal for everything (PayPal, Venmo, Credit Cards)
- One integration, one account
- Best for: Quick setup, simplicity

**Option B: PayPal + Stripe (Most Flexible)**
- PayPal for PayPal/Venmo users
- Stripe for credit cards
- Best for: Lower fees, more options

## What You Need to Do

### For PayPal Integration:

1. **Create PayPal Business Account**
   - Go to https://www.paypal.com/business
   - Sign up for Business account
   - Verify your business information

2. **Get API Credentials**
   - Log into PayPal Developer Dashboard: https://developer.paypal.com/
   - Create a new app
   - Get Client ID and Secret
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id
     PAYPAL_CLIENT_SECRET=your_secret
     ```

3. **Enable Venmo** (if using PayPal)
   - Venmo is automatically available when you enable PayPal
   - No additional setup needed

### For Stripe Integration (Credit Cards):

1. **Create Stripe Account**
   - Go to https://stripe.com
   - Sign up for free account
   - Complete business verification

2. **Get API Keys**
   - Go to Developers > API keys
   - Get Publishable key and Secret key
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
     STRIPE_SECRET_KEY=sk_test_...
     ```

3. **Test Mode**
   - Use test keys first to test payments
   - Switch to live keys when ready

## Implementation Status

✅ Payment structure created
✅ PayPal integration ready
✅ Venmo integration ready (via PayPal)
✅ Stripe integration ready
⏳ Waiting for your API keys to activate

## Next Steps

1. Choose your payment method(s)
2. Set up the account(s)
3. Get your API keys
4. Add keys to `.env.local`
5. Test payments
6. Go live!

## Testing

All payment integrations include test mode:
- **PayPal:** Use sandbox accounts
- **Stripe:** Use test card numbers (4242 4242 4242 4242)
- **Venmo:** Test via PayPal sandbox

## Fees Comparison

| Method | Fee | Notes |
|--------|-----|-------|
| PayPal | 2.9% + $0.30 | Includes Venmo |
| Stripe | 2.9% + $0.30 | Credit cards only |
| Venmo | 2.9% + $0.30 | Via PayPal |

*All fees are similar, choose based on ease of use and features*









