# Court Availability Sync with rhinebecktennis.com

## Overview

Your site will check rhinebecktennis.com every few minutes and sync court availability. If a court is not available on rhinebecktennis.com, it won't show as available on your site.

## How It Works

1. **API Route**: `/api/check-court-availability` - Checks external site
2. **Sync Function**: `lib/court-sync.ts` - Updates your time slots
3. **Scheduled Checks**: Runs every few minutes via Vercel Cron
4. **Automatic Updates**: Calendar automatically reflects external availability

## Setup Steps

### Step 1: Understand rhinebecktennis.com Structure

I need to know:
- **Where is court availability displayed?** (specific page URL?)
- **How is it shown?** (calendar, list, booking system?)
- **What format?** (dates, times, court numbers?)

### Step 2: Customize the Scraper

The API route I created needs to be customized based on how rhinebecktennis.com displays availability. I'll need to:

1. **Identify the availability page/endpoint**
2. **Parse the HTML/API response**
3. **Extract date/time availability**
4. **Map it to your time slots**

### Step 3: Set Up Scheduled Checks

I'll create a Vercel Cron job that:
- Runs every 5-10 minutes
- Checks upcoming dates (next 30 days)
- Updates your time slots accordingly

## Current Implementation

I've created:
- ✅ API route to check external site
- ✅ Sync functions to update time slots
- ⏳ **Needs customization** based on rhinebecktennis.com structure

## What I Need From You

1. **What page shows court availability?** 
   - Is it: https://rhinebecktennis.com/book-online?
   - Or a different page?

2. **How is availability displayed?**
   - Calendar view?
   - List of times?
   - Booking system?

3. **What does "unavailable" look like?**
   - Grayed out?
   - "Booked" text?
   - Missing from list?

Once I know this, I can customize the scraper to work perfectly!

## Alternative: API Access

If rhinebecktennis.com has an API or booking system we can access, that would be even better. Do you have:
- API credentials?
- Access to their booking system?
- A way to query availability programmatically?

Let me know and I'll set it up!







