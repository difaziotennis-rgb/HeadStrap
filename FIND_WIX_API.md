# How to Find the Wix Bookings API Endpoint

## Step-by-Step Guide

### Step 1: Open Browser Developer Tools

1. **Go to**: https://rhinebecktennis.com/book-online
2. **Open Developer Tools**:
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Safari**: Enable Developer menu first (Preferences > Advanced > Show Develop menu), then `Cmd+Option+I`

### Step 2: Open the Network Tab

1. Click on the **"Network"** tab in Developer Tools
2. Make sure **"Preserve log"** is checked (so requests don't disappear when page changes)
3. You should see a list that's currently empty or has some initial page load requests

### Step 3: Clear the Network Log (Optional but Helpful)

1. Click the **clear/trash icon** (🚫) to clear existing requests
2. This makes it easier to see only the new requests

### Step 4: Use the Booking Widget

1. **Click "Book Now"** button (or whatever opens the calendar)
2. **Wait for the calendar to appear**
3. **Click on a specific date** in the calendar
4. **Watch the Network tab** - you should see new requests appear!

### Step 5: Find the API Request

Look for requests that:

1. **Have "bookings" or "wix" in the URL**:
   - Examples: `bookings.wix.com`, `wix.com/bookings`, `api.wix.com`
   
2. **Are XHR or Fetch requests** (not images, CSS, etc.):
   - Look for requests with type "xhr" or "fetch"
   - They usually have JSON responses

3. **Contain date/time information**:
   - The request URL or payload might contain the date you clicked
   - Look for requests that happen right when you click a date

4. **Return JSON with time slots**:
   - Click on a request
   - Go to the "Response" or "Preview" tab
   - Look for JSON that contains time slots, availability, or booking data

### Step 6: Inspect the Request

Once you find a promising request:

1. **Click on it** in the Network tab
2. **Check the "Headers" tab**:
   - **Request URL**: This is the API endpoint!
   - **Request Method**: Usually `GET` or `POST`
   - **Request Headers**: Look for authentication tokens, API keys, etc.

3. **Check the "Payload" or "Request" tab**:
   - See what data is being sent (date, service ID, etc.)

4. **Check the "Response" or "Preview" tab**:
   - See what data is returned (available times, slots, etc.)

### Step 7: Test the API Endpoint

Once you find the endpoint:

1. **Copy the full URL** from the Request URL
2. **Note the request method** (GET/POST)
3. **Note any headers** needed (authorization, content-type, etc.)
4. **Note the request body** (if it's a POST request)

## What to Look For

### Good Signs:
- ✅ URL contains: `bookings`, `wix`, `api`, `availability`, `slots`
- ✅ Response contains: time slots, availability data, JSON arrays
- ✅ Request happens when you click a date
- ✅ Request method is GET or POST

### Example URLs You Might See:
```
https://www.wix.com/_api/bookings/availability
https://bookings.wix.com/api/v1/slots
https://www.wix.com/_api/wix-bookings/v1/availability
https://www.wix.com/_api/bookings/v1/services/{serviceId}/availability
```

## Quick Test

Once you find the endpoint, you can test it:

1. **Copy the full request as cURL**:
   - Right-click the request in Network tab
   - Select "Copy" > "Copy as cURL"
   - This gives you the exact command to test

2. **Or test in a new tab**:
   - If it's a GET request, try pasting the URL in a new browser tab
   - See if it returns data

## Share What You Find

Once you find the API endpoint, share:
1. **The full URL**
2. **Request method** (GET/POST)
3. **Any required headers** (especially authorization)
4. **Request body** (if POST)
5. **Example response** (what the JSON looks like)

Then I can integrate it into your site!

## Alternative: Use Browser Extension

If manually inspecting is difficult, you can use:

1. **Wappalyzer** (browser extension):
   - Shows what technologies a site uses
   - Might reveal Wix API endpoints

2. **Postman Interceptor**:
   - Captures all network requests
   - Easier to see API calls

## Need Help?

If you're having trouble finding it, let me know:
- What you see in the Network tab
- Any requests that look promising
- Screenshots (if possible)

I can help identify which one is the right API endpoint!







