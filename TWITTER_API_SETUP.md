# Twitter API Integration Guide

This guide will walk you through setting up the Twitter API to display top tweets on your dashboard.

## Step 1: Create a Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Sign in with your Twitter account
3. Click **"Sign up"** or **"Apply"** for a developer account
4. Fill out the application form:
   - Select **"Hobbyist"** or **"Exploring the API"** (free tier)
   - Describe your use case: "Personal dashboard to display trending tweets about business, tech, and stocks"
   - Agree to the terms and submit

## Step 2: Create a Project and App

1. Once approved, go to the [Twitter Developer Portal Dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Click **"Create Project"**
   - Name: `Dashboard App` (or any name)
   - Use case: Select **"Making a bot"** or **"Exploring the API"**
   - Description: "Personal dashboard for displaying trending tweets"
3. Click **"Create App"** within your project
   - App name: `Dashboard Tweets` (or any name)
   - Click **"Create"**

## Step 3: Get Your Bearer Token

1. In your app settings, go to the **"Keys and Tokens"** tab
2. Under **"Bearer Token"**, click **"Generate"**
3. **Copy the Bearer Token immediately** - you won't be able to see it again!
   - It will look like: `AAAAAAAAAAAAAAAAAAAAAMLheAAAAAAA0%2BuSeid%2BULvsea4JtiGRiSDSJSI%3DEUifiRBkKG5E2XzMDjR7uT4oQf7b8sH2KZ4YvV3ZqGtF`
4. **Save it securely** - you'll need it in the next step

## Step 4: Add Bearer Token to Your Project

### Option A: Local Development (`.env.local`)

1. In your project root (`/Users/derek/new-website`), create or edit `.env.local`:
   ```bash
   TWITTER_BEARER_TOKEN=your_bearer_token_here
   ```

2. Replace `your_bearer_token_here` with your actual bearer token

3. **Important**: Make sure `.env.local` is in your `.gitignore` file (it should be by default)

### Option B: Vercel Production

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`difazio-tennis-booking` or similar)
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Add:
   - **Name**: `TWITTER_BEARER_TOKEN`
   - **Value**: Your bearer token
   - **Environment**: Select **Production**, **Preview**, and **Development**
6. Click **"Save"**
7. **Redeploy** your application for the changes to take effect

## Step 5: Test the Integration

1. **Local Testing:**
   ```bash
   # Make sure your dev server is running
   npm run dev
   ```

2. Visit `http://localhost:3000/dashboard`

3. Check the browser console (F12) for any errors

4. The tweets section should now show real tweets instead of the placeholder

## Step 6: Verify API Limits

Twitter API v2 Free Tier limits:
- **1,500 tweets per month** (for search/recent endpoint)
- **300 requests per 15 minutes** (rate limit)

Our dashboard:
- Fetches tweets every 5 minutes (auto-refresh)
- Caches results for 5 minutes
- Shows top 3 tweets per request

**Estimated usage**: ~864 requests/month (well within limits)

## Troubleshooting

### Issue: "Twitter API not configured" message

**Solution**: Make sure you've added `TWITTER_BEARER_TOKEN` to your environment variables and restarted your dev server.

### Issue: 401 Unauthorized Error

**Possible causes:**
- Bearer token is incorrect
- Token has been revoked
- Token doesn't have the right permissions

**Solution**: 
1. Generate a new bearer token in Twitter Developer Portal
2. Update your environment variable
3. Restart your server

### Issue: 429 Rate Limit Exceeded

**Solution**: 
- The API is being called too frequently
- Wait 15 minutes and try again
- Check the cache settings in the API route (currently 5 minutes)

### Issue: No tweets showing

**Possible causes:**
- No tweets match the search query
- API returned empty results
- Network error

**Solution**:
1. Check browser console for errors
2. Check server logs for API responses
3. Try adjusting the search query in `/app/api/markets/tweets/route.ts`

## Testing the API Directly

You can test the API endpoint directly:

```bash
# Local
curl http://localhost:3000/api/markets/tweets

# Production (after deployment)
curl https://defaziotennis.com/api/markets/tweets
```

## Customizing the Search Query

Edit `/app/api/markets/tweets/route.ts` to change what tweets are fetched:

```typescript
// Current query (line ~20)
const query = '(business OR tech OR stocks OR finance OR investing OR startup OR AI OR crypto) -is:retweet lang:en'

// Example: Focus more on stocks
const query = '(stocks OR trading OR investing OR $AAPL OR $TSLA OR $NVDA) -is:retweet lang:en'

// Example: Tech-focused
const query = '(AI OR tech OR startup OR software OR programming) -is:retweet lang:en'
```

## Security Notes

⚠️ **Important**:
- Never commit your bearer token to git
- Never expose it in client-side code
- Keep it in environment variables only
- Rotate your token if it's ever exposed

## Next Steps

Once set up, your dashboard will:
- ✅ Automatically fetch top 3 trending tweets every 5 minutes
- ✅ Display tweets sorted by engagement (likes + retweets)
- ✅ Show tweets from the past 24 hours
- ✅ Focus on business/tech/stocks topics
- ✅ Cache results to stay within API limits

## Need Help?

If you encounter issues:
1. Check the Twitter API status: https://api.twitterstat.us/
2. Review Twitter API documentation: https://developer.twitter.com/en/docs
3. Check your API usage in the Twitter Developer Portal
