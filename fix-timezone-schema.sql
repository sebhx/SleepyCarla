-- Fix timezone issues by converting to TIMESTAMP WITH TIME ZONE
-- This ensures PostgreSQL properly handles timezone conversions

-- Drop existing table (be careful in production!)
DROP TABLE IF EXISTS wake_events CASCADE;
DROP TABLE IF EXISTS sleep_sessions CASCADE;

-- Create sleep_sessions table with proper timezone support
CREATE TABLE sleep_sessions (
  id TEXT PRIMARY KEY,
  sleep_type TEXT NOT NULL CHECK (sleep_type IN ('nap', 'night')),
  start_time TIMESTAMPTZ NOT NULL,  -- Changed to TIMESTAMPTZ
  end_time TIMESTAMPTZ,            -- Changed to TIMESTAMPTZ
  duration INTEGER,
  nap_number INTEGER CHECK (nap_number BETWEEN 1 AND 3),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,  -- Changed to TIMESTAMPTZ
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP   -- Changed to TIMESTAMPTZ
);

-- Create wake_events table with proper timezone support
CREATE TABLE wake_events (
  id TEXT PRIMARY KEY,
  sleep_session_id TEXT NOT NULL,
  wake_time TIMESTAMPTZ NOT NULL,  -- Changed to TIMESTAMPTZ
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,  -- Changed to TIMESTAMPTZ
  FOREIGN KEY (sleep_session_id) REFERENCES sleep_sessions(id) ON DELETE CASCADE
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  baby_age_range TEXT NOT NULL CHECK (baby_age_range IN ('newborn', 'infant', 'older-infant', 'toddler', 'young-toddler', 'toddler-plus')),
  baby_exact_age_weeks INTEGER,
  bedtime TIME NOT NULL DEFAULT '19:00',
  waketime TIME NOT NULL DEFAULT '07:00',
  naps_per_day INTEGER NOT NULL DEFAULT 3 CHECK (naps_per_day BETWEEN 1 AND 5),
  notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notification_advance_minutes INTEGER NOT NULL DEFAULT 15 CHECK (notification_advance_minutes >= 0),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,  -- Changed to TIMESTAMPTZ
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP   -- Changed to TIMESTAMPTZ
);

-- Add indexes for better performance
CREATE INDEX idx_sleep_sessions_start_time ON sleep_sessions(start_time);
CREATE INDEX idx_sleep_sessions_sleep_type ON sleep_sessions(sleep_type);
CREATE INDEX idx_wake_events_session_id ON wake_events(sleep_session_id);

-- Verify the schema
SELECT 
  column_name, 
  data_type, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'sleep_sessions' 
ORDER BY ordinal_position;
