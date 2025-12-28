-- Check Database Setup
-- Run this in Supabase SQL Editor to verify all required tables exist

-- 1. Check if clubs table exists and has required columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'clubs'
ORDER BY ordinal_position;

-- 2. Check if site_admin table exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'site_admin'
ORDER BY ordinal_position;

-- 3. Check if players table exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'players'
ORDER BY ordinal_position;

-- 4. Check if clubs have slugs
SELECT id, name, slug FROM clubs LIMIT 5;

-- 5. Check if site_admin has any users
SELECT COUNT(*) as admin_count FROM site_admin;

