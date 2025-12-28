# Database Setup Fix

## Problem
The ladder page isn't showing clubs and admin login doesn't work. This is because:
1. The `site_admin` table might not exist
2. Clubs might be missing the `slug` field
3. Database schema might be incomplete

## Solution

### Step 1: Run the Database Fix Script

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New query**
5. Open the file `fix-database-setup.sql` in this project
6. Copy the **ENTIRE** contents
7. Paste into the SQL Editor
8. Click **Run** (or press Cmd+Enter / Ctrl+Enter)

This script will:
- ✅ Create all required tables (`clubs`, `site_admin`, `players`, `matches`)
- ✅ Add missing columns (like `slug` to clubs)
- ✅ Create a default admin user (username: `admin`, password: `admin`)
- ✅ Set up all indexes and triggers
- ✅ Enable Row Level Security

### Step 2: Verify Setup

After running the script, you should see:
- "Setup complete!"
- Counts for clubs, site admins, and players

### Step 3: Test

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:3000/ladder`
   - You should see your clubs in the dropdown
   
3. Try admin login:
   - Click "Site Admin" at the bottom
   - Username: `admin`
   - Password: `admin`

## Default Admin Credentials

- **Username:** `admin`
- **Password:** `admin`

⚠️ **Important:** Change this password after first login! You can create a new admin with a different password using the script in `scripts/create-site-admin.js`

## Troubleshooting

If clubs still don't show:
1. Check browser console (F12) for errors
2. Check Network tab to see if `/api/clubs` returns data
3. Verify your `.env.local` file has the correct Supabase credentials

If admin login still doesn't work:
1. Check if `site_admin` table exists in Supabase
2. Check if there's a user with username `admin`
3. Try creating a new admin using: `node scripts/create-site-admin.js admin newpassword`

