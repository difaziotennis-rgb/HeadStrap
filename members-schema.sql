-- Members table - Run in Supabase SQL Editor (Lesson project)
-- Stores clients with saved payment methods via Stripe

CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_code TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_members_code ON members(member_code);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_stripe ON members(stripe_customer_id);

-- Add member fields to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS member_code TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id);

-- Enable RLS on members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Allow all operations (single-admin app)
CREATE POLICY "Allow all operations on members" ON members
  FOR ALL USING (true) WITH CHECK (true);
