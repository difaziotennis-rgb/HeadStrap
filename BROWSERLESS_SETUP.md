# Browserless.io Setup Guide

## Step 1: Create Free Account

1. **Go to**: https://browserless.io
2. **Click**: "Sign Up" or "Get Started"
3. **Sign up with**: `difaziotennis@gmail.com`
4. **Choose**: Free tier (includes 6 hours/month of browser automation)

## Step 2: Get Your API Key

1. **After signing up**, go to your **Dashboard**
2. **Find**: "API Key" or "Token" section
3. **Copy** your API key (it will look like: `abc123def456...`)

## Step 3: Add to Vercel

1. **Go to**: https://vercel.com/dashboard
2. **Select**: Your project (difazio-tennis-booking)
3. **Go to**: Settings → Environment Variables
4. **Add**:
   - **Name**: `BROWSERLESS_API_KEY`
   - **Value**: (paste your API key from Step 2)
   - **Environment**: Production, Preview, Development (check all)
5. **Click**: "Save"

## Step 4: Optional - Custom Browserless URL

If you're using a self-hosted Browserless instance, you can also set:
- **Name**: `BROWSERLESS_URL`
- **Value**: `https://chrome.browserless.io` (default) or your custom URL

## Step 5: Redeploy

After adding the environment variable:
1. **Go to**: Vercel Dashboard → Your Project → Deployments
2. **Click**: "Redeploy" on the latest deployment
3. **Or**: Just push a new commit to trigger auto-deploy

## That's It!

Once the API key is set, your site will automatically:
- Check rhinebecktennis.com every 5 minutes
- Click "Book Now" and navigate the calendar
- Extract available times
- Update your time slots accordingly

## Testing

After setup, you can test by:
1. Going to: `https://difaziotennis.com/api/check-court-availability?date=2024-12-25&hour=14`
2. It should return availability data from rhinebecktennis.com

## Free Tier Limits

- **6 hours/month** of browser automation
- That's about **72 checks per month** (if each check takes 5 minutes)
- Or **720 checks** if each takes 30 seconds
- Should be plenty for checking availability every 5 minutes!

## Need More?

If you need more than the free tier:
- **Starter**: $75/month (50 hours)
- **Pro**: $200/month (200 hours)
- But the free tier should be enough for your use case!

## Troubleshooting

**If it's not working:**
1. Check that `BROWSERLESS_API_KEY` is set in Vercel
2. Check Vercel logs for errors
3. Make sure you've redeployed after adding the env variable

Let me know once you've set it up and I can help test it!







