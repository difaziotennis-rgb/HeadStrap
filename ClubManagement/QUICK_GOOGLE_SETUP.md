# Quick Google Setup Guide

## ✅ What You Already Have

- **Gemini API Key**: `AIzaSyDMbmEBlPoi6U_DENrrr5xU52CTCCfD1UM` ✅ **Already Added**
- **Project Number**: 732041949454

## 🔍 What You Need to Find: OAuth Client ID & Secret

For **Google Calendar integration** (OAuth 2.0), you need different credentials than the API key.

## 📍 Exact Location in Google Cloud Console

**Direct URL to Credentials Page:**
```
https://console.cloud.google.com/apis/credentials?project=732041949454
```

**Step-by-Step Navigation:**
1. Go to: https://console.cloud.google.com/
2. Click the **project dropdown** → Select project #732041949454
3. In the left menu: **APIs & Services** → **Credentials**
4. Look for section: **"OAuth 2.0 Client IDs"**

## 🆕 If You Need to Create OAuth Credentials

1. On the Credentials page, click **"+ CREATE CREDENTIALS"**
2. Select **"OAuth client ID"**
3. If prompted to configure consent screen:
   - Click **"CONFIGURE CONSENT SCREEN"**
   - Choose **"External"** (unless using Google Workspace)
   - App name: "Club Management"
   - User support email: Your email
   - Developer contact: Your email
   - Click **"SAVE AND CONTINUE"** through all steps
   - Add your email as test user
   - Return to Credentials page

4. Create OAuth Client:
   - Application type: **"Web application"**
   - Name: "Club Management Calendar"
   - **Authorized redirect URIs**: Add this EXACTLY:
     ```
     http://localhost:3001/api/google/callback
     ```
   - Click **"CREATE"**

5. **Copy immediately** (you won't see the secret again):
   - **Client ID**: `xxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxx`

## ✅ Enable Required APIs

**Direct URL to API Library:**
```
https://console.cloud.google.com/apis/library?project=732041949454
```

Enable these APIs:
1. Search "**Google Calendar API**" → Click → **"ENABLE"**
2. (Optional) Search "**Google Sheets API**" → Click → **"ENABLE"**

## 🔑 Adding Your Credentials

Once you have your OAuth Client ID and Secret, I can add them for you! Just provide:
1. **Client ID** (format: `xxxxx.apps.googleusercontent.com`)
2. **Client Secret** (format: `GOCSPX-xxxxx`)

Or run this command yourself:
```bash
cd /Users/derek/new-website/ClubManagement
node add-google-keys.js "your-client-id" "your-client-secret"
```

## 📝 Current Status

✅ Gemini API key: **Configured**  
⏳ OAuth Client ID: **Need to get from Google Cloud Console**  
⏳ OAuth Client Secret: **Need to get from Google Cloud Console**  
⏳ Google Calendar API: **Need to enable**  

## 🎯 Summary

**Two Different Credentials:**
1. **API Key** (for Gemini) - ✅ You have this
2. **OAuth Client ID + Secret** (for Calendar) - ⏳ Need to get this

Both are in the same Google Cloud Console, but in different sections:
- **API Key**: APIs & Services → Credentials → "API Keys" section
- **OAuth**: APIs & Services → Credentials → "OAuth 2.0 Client IDs" section

