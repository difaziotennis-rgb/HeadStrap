# Court Availability Sync Implementation

## Current Status

I've set up the infrastructure to sync with rhinebecktennis.com, but full browser automation requires additional setup.

## The Challenge

rhinebecktennis.com uses a Wix booking widget that requires:
1. Navigating to "Court Rentals" page
2. Clicking "Book Now" button
3. Waiting for calendar to load
4. Clicking on a specific date
5. Extracting the list of available times

This requires browser automation (like Puppeteer), which is complex in serverless environments like Vercel.

## Solutions

### Option 1: Browserless.io (Recommended - Easiest)

**Browserless.io** is a service that provides browser automation as a service:

1. **Sign up**: https://browserless.io (free tier available)
2. **Get API key**
3. **Update the API route** to use Browserless instead of local Puppeteer

**Pros**: 
- Works perfectly in serverless
- No setup complexity
- Reliable

**Cons**: 
- Requires external service (but has free tier)

### Option 2: Find Wix Bookings API

Wix Bookings might have an API endpoint we can call directly:

1. **Inspect Network Tab**: When you click "Book Now" and select a date, check the browser's Network tab
2. **Find API calls**: Look for requests to `wix.com` or `bookings` endpoints
3. **Use that API directly**: Much faster than browser automation

**Pros**: 
- Fast and reliable
- No browser needed

**Cons**: 
- Requires finding the API endpoint
- May require authentication

### Option 3: Manual Sync (Temporary)

For now, you can manually sync availability:

1. Check rhinebecktennis.com daily
2. Update unavailable times in your admin panel
3. System will respect those settings

**Pros**: 
- Works immediately
- No technical setup

**Cons**: 
- Requires manual work
- Not automatic

## Next Steps

**I recommend Option 1 (Browserless.io)** - it's the easiest and most reliable.

Would you like me to:
1. Set up Browserless.io integration?
2. Help you find the Wix API endpoint?
3. Set up a manual sync process?

Let me know which option you prefer!

## Current Implementation

The code is ready - it just needs the browser automation piece. The API routes are set up at:
- `/api/check-court-availability` - Simple check (currently defaults to available)
- `/api/check-court-availability-browser` - Browser-based check (needs Puppeteer setup)

Once we add browser automation, it will automatically:
- Check rhinebecktennis.com every 5 minutes
- Update your time slots accordingly
- Hide unavailable times from users







