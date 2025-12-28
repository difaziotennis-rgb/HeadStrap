# Deploy to difaziotennis.com

## Option 1: Vercel (Recommended - Easiest)

Vercel is made by the creators of Next.js and offers the simplest deployment process.

### Steps:

1. **Create a Vercel account** (if you don't have one):
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub, GitLab, or email

2. **Deploy your project**:
   - Click "Add New Project" in Vercel dashboard
   - Import your Git repository (GitHub/GitLab/Bitbucket)
   - OR use Vercel CLI (see below)

3. **Using Vercel CLI** (if you prefer command line):
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```
   Follow the prompts to deploy.

4. **Add your custom domain**:
   - In your Vercel project settings, go to "Domains"
   - Add `difaziotennis.com` and `www.difaziotennis.com`
   - Vercel will provide DNS records to add to your domain registrar

5. **Configure DNS** (at your domain registrar):
   - Add the DNS records Vercel provides
   - Usually an A record or CNAME pointing to Vercel

6. **Set Environment Variables**:
   - In Vercel project settings, go to "Environment Variables"
   - Add all variables from `.env.local` (except use production URLs):
     - `NEXT_PUBLIC_BASE_URL=https://difaziotennis.com`
     - Add all your Firebase, Stripe, PayPal keys
     - Add `NEXT_PUBLIC_ADMIN_EMAIL=your_email@gmail.com`

7. **Redeploy** after adding environment variables

---

## Option 2: Netlify

1. Go to [netlify.com](https://netlify.com)
2. Sign up/login
3. Click "Add new site" > "Import an existing project"
4. Connect your Git repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Add custom domain in site settings
7. Configure DNS as instructed

---

## Option 3: Self-Hosted (VPS)

If you have a VPS or server:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

3. **Use a process manager** (PM2 recommended):
   ```bash
   npm install -g pm2
   pm2 start npm --name "difazio-tennis" -- start
   pm2 save
   pm2 startup
   ```

4. **Set up reverse proxy** (Nginx):
   - Configure Nginx to proxy requests to `localhost:3000`
   - Set up SSL with Let's Encrypt

---

## Environment Variables for Production

Make sure to set these in your hosting platform:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_ADMIN_EMAIL=your_email@gmail.com
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
NEXT_PUBLIC_BASE_URL=https://difaziotennis.com
```

**Important**: Use production keys (not test keys) for Stripe and PayPal in production!

---

## Quick Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (first time will ask questions)
vercel

# Deploy to production
vercel --prod
```

Then add your domain in the Vercel dashboard.

