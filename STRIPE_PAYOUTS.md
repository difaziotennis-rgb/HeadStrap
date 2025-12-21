# Where Do Stripe Payments Go?

## Payment Flow

When a customer pays with a credit card:

1. **Payment goes to your Stripe account**
   - Stripe processes the payment
   - Money is held in your Stripe account balance
   - You can see it in your Stripe Dashboard

2. **Stripe transfers to your bank account**
   - Stripe automatically transfers money to your connected bank account
   - **Transfer schedule**: Usually 2-7 business days (depending on your account)
   - **First payment**: May take up to 14 days (Stripe's standard hold period for new accounts)

## Setting Up Your Bank Account

To receive payments, you need to connect a bank account to Stripe:

### Step 1: Connect Bank Account

1. **Go to**: https://dashboard.stripe.com/settings/payouts
2. **Click**: "Add bank account" or "Connect bank account"
3. **Enter** your bank details:
   - Bank name
   - Account number
   - Routing number
   - Account type (checking/savings)
4. **Verify** the account (Stripe will make 2 small deposits you need to confirm)

### Step 2: Set Payout Schedule

1. **Go to**: https://dashboard.stripe.com/settings/payouts
2. **Choose** payout schedule:
   - **Daily** (recommended) - Get paid every day
   - **Weekly** - Get paid once a week
   - **Monthly** - Get paid once a month
   - **Manual** - Transfer when you want

### Step 3: Verify Your Identity

For new Stripe accounts, you may need to:
1. **Complete identity verification**
2. **Provide business information** (even if it's just your name)
3. **This is required** before you can receive payouts

## Payment Timeline

### Example: Customer pays $160 on Monday

- **Monday**: Payment processed, $160 in your Stripe balance
- **Tuesday-Friday**: Money held by Stripe (processing period)
- **Next Monday** (or your payout day): $155.06 transferred to your bank account
  - ($160 - $4.94 Stripe fee = $155.06)

### First Payment

- **First payment** may take 7-14 days
- This is Stripe's standard hold for new accounts
- After that, regular schedule applies

## Where to See Your Money

1. **Stripe Dashboard**: https://dashboard.stripe.com/payments
   - See all payments
   - See pending payouts
   - See your balance

2. **Payouts Page**: https://dashboard.stripe.com/payouts
   - See scheduled transfers
   - See transfer history
   - See when money will arrive

3. **Your Bank Account**
   - Money appears as "STRIPE" or "STRIPE PAYOUT"
   - Usually takes 1-2 business days after Stripe initiates transfer

## Fees Deducted Automatically

- Stripe automatically deducts fees (2.9% + $0.30)
- You receive the net amount
- Fees are visible in your Stripe dashboard

## Important Notes

- **No manual action needed** - Stripe handles everything automatically
- **Secure** - Stripe is PCI compliant and handles all card data
- **Reliable** - Used by millions of businesses worldwide
- **Transparent** - See every transaction in your dashboard

## Need Help?

- **Stripe Support**: https://support.stripe.com
- **Dashboard**: https://dashboard.stripe.com
- **Documentation**: https://stripe.com/docs/payouts

Once you connect your bank account, payments will automatically transfer to it! 🎉

