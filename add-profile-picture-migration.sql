-- Migration: Add profile_picture_url column to players table
-- Run this in your Supabase SQL Editor

-- Add profile_picture_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'players' AND column_name = 'profile_picture_url') THEN
    ALTER TABLE players ADD COLUMN profile_picture_url TEXT;
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'players' AND column_name = 'profile_picture_url';
