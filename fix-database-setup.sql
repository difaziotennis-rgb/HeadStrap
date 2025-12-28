-- Complete Database Setup for Ladder System
-- Run this ENTIRE script in your Supabase SQL Editor
-- This will create all required tables and fix any missing columns

-- ============================================
-- 1. Create clubs table (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  admin_password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add slug column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'clubs' AND column_name = 'slug') THEN
    ALTER TABLE clubs ADD COLUMN slug TEXT UNIQUE;
  END IF;
END $$;

-- ============================================
-- 2. Create site_admin table
-- ============================================
CREATE TABLE IF NOT EXISTS site_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. Create players table
-- ============================================
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  position INTEGER,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(club_id, email)
);

-- Add position column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'players' AND column_name = 'position') THEN
    ALTER TABLE players ADD COLUMN position INTEGER;
  END IF;
END $$;

-- ============================================
-- 4. Create matches table
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  loser_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  score TEXT NOT NULL,
  date_played TIMESTAMPTZ NOT NULL,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (winner_id != loser_id)
);

-- Add club_id to matches if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'matches' AND column_name = 'club_id') THEN
    ALTER TABLE matches ADD COLUMN club_id UUID REFERENCES clubs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 5. Fix existing clubs - add slugs if missing
-- ============================================
-- Generate slugs for clubs that don't have them
UPDATE clubs 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- ============================================
-- 6. Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_players_club_id ON players(club_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(club_id, position);
CREATE INDEX IF NOT EXISTS idx_matches_club_id ON matches(club_id);
CREATE INDEX IF NOT EXISTS idx_matches_winner_id ON matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_matches_loser_id ON matches(loser_id);

-- ============================================
-- 7. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (we handle auth in the app)
CREATE POLICY IF NOT EXISTS "Allow all on clubs" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on site_admin" ON site_admin FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on matches" ON matches FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 8. Create updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;
CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Create default site admin (username: admin, password: admin)
-- ============================================
-- Only create if it doesn't exist
INSERT INTO site_admin (username, password_hash)
VALUES (
  'admin',
  '$2b$10$Ogi3eJ6SP/CXnkZLm9SfDuoAa9Nj/ocS4Qm0BFiY95DOLArZMxHLW' -- bcrypt hash for "admin"
)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- Done! Verify setup
-- ============================================
SELECT 'Setup complete!' as status;
SELECT 'Clubs:' as info, COUNT(*) as count FROM clubs;
SELECT 'Site Admins:' as info, COUNT(*) as count FROM site_admin;
SELECT 'Players:' as info, COUNT(*) as count FROM players;

