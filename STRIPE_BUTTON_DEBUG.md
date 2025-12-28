# Debug Stripe Payment Button Not Showing

## Quick Check

When you select "Credit or Debit Card" in the payment modal, you should see ONE of these:

### Option 1: Button Shows ✅
- You see a purple "Pay with Card" button
- This means Stripe is configured correctly

### Option 2: Error Message Shows ⚠️
- You see a yellow box saying "Stripe Not Configured"
- This means `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is missing

### Option 3: Nothing Shows ❌
- You see nothing (blank space)
- This means there's a JavaScript error

## How to Debug

### Step 1: Open Browser Console
1. Press **F12** (or right-click → Inspect)
2. Go to **Console** tab
3. Look for any red error messages

### Step 2: Check for Stripe Debug Message
Look for a message that says:
```
🔍 Stripe Debug: { hasKey: true/false, ... }
```

**If `hasKey: false`:**
- The Stripe key is not set in Vercel
- Go to Vercel → Settings → Environment Variables
- Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Redeploy

**If `hasKey: true` but button doesn't show:**
- There's a rendering error
- Check console for other errors

### Step 3: Verify Vercel Environment Variables

1. **Go to**: https://vercel.com/dashboard
2. **Select**: Your project
3. **Go to**: Settings → Environment Variables
4. **Check**:
   - ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` exists
   - ✅ Value starts with `pk_test_` or `pk_live_`
   - ✅ Checked for: Production, Preview, Development

### Step 4: Redeploy After Adding Key

**Important**: After adding the key, you MUST redeploy:

1. **Go to**: Deployments tab
2. **Click**: "Redeploy" on latest deployment
3. **Or**: Push a new commit (auto-deploys)

## Common Issues

### Issue: Key Added But Button Still Not Showing
**Solution**: 
- Keys are only available after redeploy
- Uncheck "Use existing Build Cache" when redeploying
- Wait 2-3 minutes for deployment

### Issue: Button Shows But Clicking Does Nothing
**Solution**:
- Check console for errors
- Verify `STRIPE_SECRET_KEY` is also set
- Check that `NEXT_PUBLIC_BASE_URL` is set

### Issue: Nothing Shows At All
**Solution**:
- Check browser console for JavaScript errors
- Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
- Try incognito mode

## What to Tell Me

Please share:
1. ✅ What you see when selecting "Credit or Debit Card" (button, error, or nothing)
2. ✅ Any console errors (F12 → Console)
3. ✅ Whether `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set in Vercel
4. ✅ The `🔍 Stripe Debug:` message from console (if any)




