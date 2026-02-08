-- Booking System Tables - Run in Supabase SQL Editor
-- (Uses the same Supabase instance as lesson intelligence)

-- Time slots table (admin availability + one-off bookings)
CREATE TABLE IF NOT EXISTS time_slots (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  hour REAL NOT NULL,
  available BOOLEAN DEFAULT false,
  booked BOOLEAN DEFAULT false,
  booked_by TEXT,
  booked_email TEXT,
  booked_phone TEXT,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);
CREATE INDEX IF NOT EXISTS idx_time_slots_available ON time_slots(available);
CREATE INDEX IF NOT EXISTS idx_time_slots_booked ON time_slots(booked);

-- Bookings table (booking requests from clients)
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  time_slot_id TEXT NOT NULL,
  date TEXT NOT NULL,
  hour REAL NOT NULL,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  payment_status TEXT,
  amount REAL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Recurring lessons table
CREATE TABLE IF NOT EXISTS recurring_lessons (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  day_of_week INTEGER NOT NULL,
  hour REAL NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  cancelled_dates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recurring_lessons_day ON recurring_lessons(day_of_week);

-- Enable Row Level Security
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_lessons ENABLE ROW LEVEL SECURITY;

-- Allow all operations (single-admin app, no multi-tenancy needed)
CREATE POLICY "Allow all operations on time_slots" ON time_slots
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on bookings" ON bookings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on recurring_lessons" ON recurring_lessons
  FOR ALL USING (true) WITH CHECK (true);
