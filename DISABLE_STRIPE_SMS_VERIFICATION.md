# How to Disable SMS Verification on Stripe Payment Link

## Option 1: Disable Stripe Link (Most Common Cause)

SMS verification is usually caused by **Stripe Link** feature. Disable it:

1. **Go to**: https://dashboard.stripe.com
2. **Login** to your Stripe account
3. **Click**: "Settings" (gear icon) in the left sidebar
4. **Click**: "Payment methods"
5. **Find**: "Link" section
6. **Toggle OFF** the Link feature
7. **Save** changes

This will disable SMS verification prompts during checkout.

## Option 2: Edit Payment Link Settings

1. **Go to**: Stripe Dashboard → Products → Payment links
2. **Find** your payment link: `https://buy.stripe.com/14A5kD2SDeduaET9YD7N600`
3. **Click** on it to edit
4. **Look for**: "Customer information" section
5. **Find**: "Phone number" field
6. **Change** to "Optional" or "Not required"
7. **Save** changes

## Option 3: Disable Phone Collection Entirely

1. **Go to**: Stripe Dashboard → Products → Payment links
2. **Click** on your payment link
3. **Click**: "Edit" or "Settings"
4. **Scroll** to "Customer information"
5. **Uncheck** "Collect phone number" or set to "Optional"
6. **Save**

## Why SMS Verification Happens

- **Stripe Link**: If enabled, requires SMS verification for security
- **Phone Required**: If phone number is set as required
- **Account Security**: Some Stripe accounts have SMS verification enabled by default

## After Making Changes

- ✅ Changes take effect **immediately**
- ✅ No need to update your code
- ✅ The payment link URL stays the same
- ✅ Users can now checkout without SMS verification

## Note

- SMS verification is a security feature
- Disabling it makes checkout faster but slightly less secure
- You can always re-enable it later if needed

## Quick Test

After disabling, test your payment link:
1. Click: `https://buy.stripe.com/14A5kD2SDeduaET9YD7N600`
2. Try to checkout
3. Should NOT prompt for SMS verification anymore

