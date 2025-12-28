# Supabase Setup Guide

Your merged site needs Supabase environment variables to connect to your database.

## Quick Setup Steps

### 1. Get Your Supabase Credentials

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** (gear icon) → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 2. Create `.env.local` File

Create a file named `.env.local` in the project root (`/Users/derek/new-website/.env.local`) with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Keep your existing Firebase variables if you have them
# (for the booking system)
```

### 3. Test the Connection

Run this command to verify:

```bash
node check-supabase-connection.js
```

Or test manually by running:

```bash
npm run dev
```

Then visit `http://localhost:3000/ladder` and check if clubs appear.

## For Vercel Deployment

You also need to add these environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
4. Redeploy your site

## Troubleshooting

- **"No clubs found"**: Make sure you've created clubs in Supabase or run the database schema
- **Connection errors**: Verify your URL and key are correct (no extra spaces)
- **Build errors**: Make sure `.env.local` exists and has both variables

