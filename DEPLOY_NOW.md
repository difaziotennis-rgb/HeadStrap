# Deploy to Vercel - Step by Step

## Current Status: No deployment yet

You need to deploy your code to Vercel first, then add the domain.

## Option 1: Deploy from GitHub (Recommended)

### Step 1: Push to GitHub
1. Create repo at: https://github.com/new
   - Name: `difazio-tennis-booking`
   - Don't add README
   - Click "Create repository"

2. Push your code:
```bash
cd /Users/derek/Public
git remote add origin https://github.com/YOUR_USERNAME/difazio-tennis-booking.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to: https://vercel.com
2. Sign up/login
3. Click "Add New Project"
4. Click "Import Git Repository"
5. Select your `difazio-tennis-booking` repo
6. Click "Deploy"
7. Wait 2-3 minutes

### Step 3: Add Domain
1. In Vercel project → Settings → Domains
2. Add: `difaziotennis.com`
3. Add: `www.difaziotennis.com`
4. Copy the DNS records Vercel shows
5. Add them in Wix DNS settings

---

## Option 2: Deploy Directly (Without GitHub)

1. Go to: https://vercel.com
2. Sign up/login
3. Click "Add New Project"
4. Click "Deploy without Git" or "Upload"
5. **Drag and drop your `/Users/derek/Public` folder**
6. Click "Deploy"
7. Wait 2-3 minutes

Then add domain as above.

---

## Quick Deploy Command (If you have Vercel CLI)

```bash
cd /Users/derek/Public
npx vercel --prod
```

(You'll need to login first: `npx vercel login`)

---

**Which method do you want to use?** I recommend Option 1 (GitHub) because it auto-deploys on future updates.








