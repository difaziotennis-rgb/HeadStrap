# Google API Setup Guide

## Step 1: Create .env.local file

Create a `.env.local` file in the root of your `ClubManagement` folder with the following structure:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/clubmanagement?schema=public"

# Google API Configuration
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/google/callback"

# OpenAI (for AI features)
OPENAI_API_KEY="sk-your-openai-api-key"

# Stripe (optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## Step 2: Get Your Google API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Google Calendar API**
   - **Google Sheets API** (optional, for exports)
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen if prompted
6. Set Application type to "Web application"
7. Add Authorized redirect URIs:
   - For local development: `http://localhost:3001/api/google/callback`
   - For production: `https://yourdomain.com/api/google/callback`
8. Copy your **Client ID** and **Client Secret**
9. Paste them into your `.env.local` file

## Step 3: Replace the Values

Replace the following in your `.env.local` file:
- `your-google-client-id.apps.googleusercontent.com` → Your actual Google Client ID
- `your-google-client-secret` → Your actual Google Client Secret

## Step 4: Connect Google Calendar

1. Start your development server: `npm run dev`
2. Navigate to `/admin/integrations`
3. Find "Google Calendar" in the list
4. Click the "Connect" button
5. You'll be redirected to Google to authorize access
6. After authorization, you'll be redirected back to the integrations page
7. Google Calendar is now connected!

## Features Enabled

Once connected, you can:
- **Sync Reservations**: Court bookings and tee times will automatically sync to Google Calendar
- **View Events**: Fetch and display events from Google Calendar
- **Export to Sheets**: Export reports to Google Sheets (if enabled)

## Security Notes

- Never commit your `.env.local` file to git (it's already in .gitignore)
- Keep your Client Secret secure
- For production, use environment variables in your hosting platform
- Consider using a service account for server-to-server communication if needed

## Troubleshooting

### Error: "Google API credentials not configured"
- Make sure `.env.local` file exists in the root directory
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set correctly
- Restart your development server after adding environment variables

### Error: "Redirect URI mismatch"
- Make sure the redirect URI in Google Cloud Console matches exactly: `http://localhost:3001/api/google/callback`
- Check that your server is running on port 3001

### Error: "Failed to generate auth URL"
- Verify your environment variables are loaded correctly
- Check that the Google APIs are enabled in your Google Cloud project

