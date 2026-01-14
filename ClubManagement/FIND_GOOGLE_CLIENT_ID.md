# How to Find Your Google OAuth Client ID

## Important Distinction

You have **two different types** of Google credentials:

1. **Google API Key** (what you have: `AIzaSyDMbmEBlPoi6U_DENrrr5xU52CTCCfD1UM`)
   - This is for direct API calls (like Gemini)
   - ✅ Already added to your `.env.local` as `GOOGLE_GEMINI_API_KEY`

2. **Google OAuth Client ID & Secret** (what you need for Calendar integration)
   - This is for OAuth 2.0 authentication (user authorization flow)
   - Needed for Google Calendar sync
   - ❌ Still need to get this

## Step-by-Step: Finding Your OAuth Client ID

### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### Step 2: Select Your Project
- Click the project dropdown at the top
- Select your project: **Project #732041949454** (or the project name)

### Step 3: Navigate to Credentials
1. Click the **☰ Menu** (hamburger icon) in the top left
2. Go to **APIs & Services** → **Credentials**

### Step 4: Find or Create OAuth 2.0 Client ID

**If you already have OAuth credentials:**
- Look for **"OAuth 2.0 Client IDs"** section
- You should see entries like:
  - Type: "Web application" or "Web client"
  - Client ID: `xxxxx.apps.googleusercontent.com`
  - Client Secret: (click "Edit" or eye icon to reveal)

**If you need to create new OAuth credentials:**

1. Click **"+ CREATE CREDENTIALS"** at the top
2. Select **"OAuth client ID"**
3. If prompted, configure the **OAuth consent screen** first:
   - User Type: Choose "Internal" (if using Google Workspace) or "External" (for public)
   - Fill in required fields: App name, User support email, Developer contact
   - Click "Save and Continue"
   - Scopes: Click "Save and Continue" (default scopes are fine)
   - Test users: Add your email, then "Save and Continue"
   - Summary: Review and "Back to Dashboard"

4. Now create the OAuth Client ID:
   - **Application type**: Select **"Web application"**
   - **Name**: Enter a name like "Club Management Calendar"
   - **Authorized JavaScript origins**: 
     - Add: `http://localhost:3001`
   - **Authorized redirect URIs**:
     - Add: `http://localhost:3001/api/google/callback`
     - (For production, add: `https://yourdomain.com/api/google/callback`)
   - Click **"CREATE"**

5. **Copy your credentials:**
   - A popup will show your **Client ID** and **Client Secret**
   - **IMPORTANT**: Copy these immediately - you won't be able to see the secret again!
   - Format:
     - Client ID: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
     - Client Secret: `GOCSPX-abcdefghijklmnopqrstuvwxyz`

### Step 5: Enable Required APIs
Make sure these APIs are enabled in your project:
1. Go to **APIs & Services** → **Library**
2. Search for and enable:
   - ✅ **Google Calendar API**
   - ✅ **Google Sheets API** (optional, for exports)
3. Click "Enable" for each

### Step 6: Add to Your .env.local File

Once you have your OAuth Client ID and Secret, add them to `.env.local`:

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/google/callback"
```

Or use the helper script:
```bash
cd /Users/derek/new-website/ClubManagement
node add-google-keys.js "your-client-id.apps.googleusercontent.com" "your-client-secret"
```

## Quick Reference

- **Your Project Number**: 732041949454
- **Your Gemini API Key**: ✅ Already configured
- **OAuth Redirect URI**: `http://localhost:3001/api/google/callback`
- **APIs to Enable**: Google Calendar API (required), Google Sheets API (optional)

## Troubleshooting

**"I don't see OAuth 2.0 Client IDs"**
- Make sure you're on the "Credentials" page
- Look for "Create Credentials" button
- You may need to configure OAuth consent screen first

**"Redirect URI mismatch error"**
- Make sure the redirect URI in Google Cloud Console matches exactly: `http://localhost:3001/api/google/callback`
- Check for trailing slashes or typos

**"Client Secret is missing"**
- If you already created OAuth credentials but lost the secret, you'll need to create a new one
- Go to your OAuth client → Click "Edit" or create new credentials

