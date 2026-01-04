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

### Option 1: Find Wix Bookings API

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

### Option 2: Manual Sync (Recommended)

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

**I recommend Option 2 (Manual Sync)** - it's the most reliable and doesn't require external services.

Would you like me to:
1. Help you find the Wix API endpoint?
2. Set up a manual sync process?

Let me know which option you prefer!

## Current Implementation

The API routes are set up at:
- `/api/check-court-availability` - Simple check (currently defaults to available)

You can manually manage availability via the admin panel:
- Go to `/book` page
- Click "Admin Login"
- Toggle time slots to available/unavailable







