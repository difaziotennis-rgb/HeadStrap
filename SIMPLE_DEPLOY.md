# Simple Deployment Guide for difaziotennis.com

## What hosting do you currently have for difaziotennis.com?

Your Next.js app needs **Node.js hosting** (not traditional shared hosting). Here are your options:

---

## ✅ EASIEST: Vercel (Free, 2 minutes)

1. Go to **https://vercel.com** and sign up (free)
2. Click **"Add New Project"**
3. **Option A**: Connect your GitHub/GitLab (if you have the code there)
   - Click "Import Git Repository"
   - Select your repo
   - Click "Deploy"
   
4. **Option B**: Deploy from your computer
   - Click "Add New Project" > "Deploy without Git"
   - Drag and drop your `/Users/derek/Public` folder
   - Click "Deploy"

5. **Add your domain**:
   - In project settings, go to "Domains"
   - Add `difaziotennis.com` and `www.difaziotennis.com`
   - Vercel will show you DNS records to add at your domain registrar

6. **Add environment variables** (in Vercel project settings):
   - Copy all variables from your `.env.local` file
   - Change `NEXT_PUBLIC_BASE_URL` to `https://difaziotennis.com`

**That's it!** Your site will be live in 2 minutes.

---

## Alternative: Netlify (Also Free)

1. Go to **https://netlify.com** and sign up
2. Drag and drop your project folder
3. Add your domain in settings
4. Done!

---

## If you have a VPS/Server with SSH access:

I can create a deployment script that:
- Builds your app
- Uploads it via SFTP/SSH
- Restarts your server

Just let me know your server details.

---

## If you have cPanel/Shared Hosting:

Unfortunately, Next.js needs Node.js, which most shared hosting doesn't support. You'll need to:
- Switch to Vercel/Netlify (free and easier)
- Or upgrade to a VPS that supports Node.js

---

## Quick Questions:

1. **Do you currently have a website at difaziotennis.com?** (What hosting provider?)
2. **Do you have SSH/FTP access?**
3. **Do you have a GitHub/GitLab account?** (Makes deployment easier)

Let me know and I'll create the exact deployment steps for your situation!

