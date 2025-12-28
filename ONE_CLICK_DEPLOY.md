# One-Click Deployment Guide

I've set up automated deployment for you! Here are your options:

## Option 1: Automated Script (Easiest - 3 steps)

I've created a script that does most of the work:

```bash
chmod +x auto-deploy.sh
./auto-deploy.sh
```

This will:
1. Install Vercel CLI (if needed)
2. Login to Vercel (opens browser - you just click "Authorize")
3. Build your project
4. Deploy to production

**Then** you just need to:
- Add your domain in Vercel dashboard (Settings > Domains)
- Add environment variables (Settings > Environment Variables)

---

## Option 2: GitHub Auto-Deploy (Set once, deploy forever)

If you have a GitHub account, I've created a workflow that auto-deploys on every push:

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Get Vercel tokens** (one-time setup):
   - Go to https://vercel.com/account/tokens
   - Create a new token
   - Copy the token

3. **Add secrets to GitHub**:
   - Go to your GitHub repo > Settings > Secrets and variables > Actions
   - Add these secrets:
     - `VERCEL_TOKEN` = your token from step 2
     - `VERCEL_ORG_ID` = get from Vercel dashboard (Settings > General)
     - `VERCEL_PROJECT_ID` = get after first deploy

4. **Deploy once manually** (to get project ID):
   ```bash
   npx vercel --prod
   ```

5. **That's it!** Every time you push to GitHub, it auto-deploys.

---

## Option 3: Vercel Dashboard (No command line)

1. Go to https://vercel.com
2. Sign up/login
3. Click "Add New Project"
4. Click "Deploy without Git"
5. **Drag and drop your entire `/Users/derek/Public` folder**
6. Click "Deploy"
7. Add domain in settings

**This is literally drag-and-drop!**

---

## Which should you use?

- **Option 3** if you want the absolute simplest (just drag a folder)
- **Option 1** if you're comfortable with terminal
- **Option 2** if you want automatic deployments from GitHub

All options are free and take about 2-5 minutes!

