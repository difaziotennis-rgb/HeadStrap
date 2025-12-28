# Deploy via GitHub - Step by Step

Your code is ready! Here's exactly what to do:

## Step 1: Create GitHub Repository (2 minutes)

1. Go to **https://github.com/new**
2. Repository name: `difazio-tennis-booking` (or any name you like)
3. **Leave it Public or Private** (your choice)
4. **DO NOT** check "Add a README file" (we already have one)
5. Click **"Create repository"**

## Step 2: Push Your Code (1 minute)

After creating the repo, GitHub will show you commands. Use these:

```bash
cd /Users/derek/Public
git remote add origin https://github.com/YOUR_USERNAME/difazio-tennis-booking.git
git push -u origin main
```

(Replace `YOUR_USERNAME` with your actual GitHub username)

## Step 3: Deploy to Vercel (3 minutes)

1. Go to **https://vercel.com**
2. Sign up/login (free)
3. Click **"Add New Project"**
4. Click **"Import Git Repository"**
5. Find and select your `difazio-tennis-booking` repository
6. Click **"Deploy"** (Vercel will auto-detect Next.js settings)
7. Wait ~2 minutes for deployment

## Step 4: Add Your Domain (2 minutes)

1. In your Vercel project, go to **Settings** → **Domains**
2. Add: `difaziotennis.com`
3. Add: `www.difaziotennis.com`
4. Vercel will show you DNS records to add at your domain registrar
5. Copy those DNS records
6. Go to your domain registrar (where you bought difaziotennis.com)
7. Add the DNS records Vercel provided
8. Wait 5-60 minutes for DNS to propagate

## Step 5: Add Environment Variables

1. In Vercel project → **Settings** → **Environment Variables**
2. Add all variables from your `.env.local` file:
   - `NEXT_PUBLIC_BASE_URL` = `https://difaziotennis.com`
   - All your Firebase keys
   - All your Stripe/PayPal keys
   - `NEXT_PUBLIC_ADMIN_EMAIL` = your email

3. Click **"Redeploy"** after adding variables

## ✅ Done!

Your site will be live at **https://difaziotennis.com**!

**Bonus:** Every time you push code to GitHub, Vercel will automatically redeploy! 🚀








