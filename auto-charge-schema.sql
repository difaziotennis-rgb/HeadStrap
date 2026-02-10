-- Auto-charge fields for member bookings - Run in Supabase SQL Editor (Lesson project)
-- Adds scheduling fields to the bookings table

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS auto_charge_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS auto_charge_cancelled BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_bookings_auto_charge ON bookings(auto_charge_at)
  WHERE auto_charge_at IS NOT NULL AND auto_charge_cancelled = false AND payment_status != 'paid';
