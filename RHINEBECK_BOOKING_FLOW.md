# Rhinebeck Tennis Club Booking Flow - What We Need to Check

## Goal
Check if a specific date/time is available on rhinebecktennis.com

## What We Need to Do

### Step 1: Navigate to Booking Page
- URL: `https://rhinebecktennis.com/book-online`
- Wait for page to fully load

### Step 2: Find the Booking Widget
The site uses Wix Bookings, so we need to:
- Look for the Wix booking widget/calendar
- It might already be visible on the page
- OR we might need to click a "Book Now" button first

### Step 3: Select the Date
- Find the calendar
- Click on the specific date we're checking
- Wait for time slots to load

### Step 4: Extract Available Times
- Find all available time slot buttons/elements
- Extract the time text (e.g., "10:00 AM", "2:00 PM")
- Check if our specific time is in that list

## What We're Currently Trying

Our Browserless code tries to:
1. Navigate to the booking page
2. Find and click "Book Now" button (if needed)
3. Click on the specific date in the calendar
4. Extract all available time slots
5. Check if our time matches

## The Problem

**Browserless won't accept our code format** - we're getting "code is not a function" errors before we can even test if our instructions are correct.

## What We Should Do

1. **First**: Get Browserless to accept ANY code format (even a simple test)
2. **Then**: Verify our instructions match what's actually on rhinebecktennis.com
3. **Finally**: Refine the code to correctly extract availability

## To Help

If you can visit rhinebecktennis.com/book-online and tell us:
- What do you see when you first load the page?
- Is there a calendar visible immediately?
- Or do you need to click something first?
- What do the available time slots look like? (buttons? links? text?)

This will help us write the correct instructions for Browserless!

