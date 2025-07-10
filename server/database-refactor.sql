-- New database schema for SleepyCarla
-- This design properly separates sleep sessions from wake events
-- and establishes proper foreign key relationships
-- Includes user settings table for persistent storage

-- Drop existing tables (for migration)
-- DROP TABLE IF EXISTS sleep_entries;
-- DROP TABLE IF EXISTS wake_events CASCADE;
-- DROP TABLE IF EXISTS sleep_sessions CASCADE;
-- DROP TABLE IF EXISTS user_settings CASCADE;

-- Main sleep sessions table
CREATE TABLE IF NOT EXISTS sleep_sessions (
  id TEXT PRIMARY KEY,
  sleep_type TEXT NOT NULL CHECK (sleep_type IN ('nap', 'night')),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,  -- NULL if sleep is ongoing
  duration INTEGER,    -- in minutes, calculated when end_time is set
  nap_number INTEGER CHECK (nap_number BETWEEN 1 AND 3), -- For naps only
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wake events table (strongly linked to sleep sessions)
CREATE TABLE IF NOT EXISTS wake_events (
  id TEXT PRIMARY KEY,
  sleep_session_id TEXT NOT NULL,
  wake_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sleep_session_id) REFERENCES sleep_sessions(id) ON DELETE CASCADE
);

-- User settings table for persistent storage of app preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  baby_age_range TEXT NOT NULL CHECK (baby_age_range IN ('newborn', 'infant', 'older-infant', 'toddler', 'young-toddler', 'toddler-plus')) DEFAULT 'older-infant',
  baby_exact_age_weeks INTEGER,
  bedtime TIME NOT NULL DEFAULT '19:00',
  morning_wake TIME NOT NULL DEFAULT '07:00',
  enable_nap_suggestions BOOLEAN NOT NULL DEFAULT true,
  notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL CHECK (theme IN ('light', 'dark', 'auto')) DEFAULT 'light',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO user_settings (id, baby_age_range, bedtime, morning_wake, enable_nap_suggestions, notifications_enabled, theme)
VALUES ('default', 'older-infant', '19:00', '07:00', true, false, 'light')
ON CONFLICT (id) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_start_time ON sleep_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_type ON sleep_sessions(sleep_type);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_date ON sleep_sessions(DATE(start_time));
CREATE INDEX IF NOT EXISTS idx_wake_events_wake_time ON wake_events(wake_time);
CREATE INDEX IF NOT EXISTS idx_wake_events_sleep_session ON wake_events(sleep_session_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated ON user_settings(updated_at);

-- Migration script to convert existing data
-- This would be run to migrate from the old single-table design

-- Step 1: Create temporary migration table to map old entries
CREATE TABLE IF NOT EXISTS migration_mapping (
  old_sleep_id TEXT,
  old_wake_id TEXT,
  new_sleep_session_id TEXT,
  new_wake_event_id TEXT
);

-- Step 2: Insert sleep sessions from old sleep entries
INSERT INTO sleep_sessions (id, sleep_type, start_time, end_time, duration, nap_number, notes, created_at)
SELECT 
  id,
  COALESCE(sleep_type, CASE WHEN nap_number > 0 THEN 'nap' ELSE 'night' END),
  timestamp,
  CASE 
    WHEN duration IS NOT NULL AND duration > 0 
    THEN datetime(timestamp, '+' || duration || ' minutes')
    ELSE NULL 
  END,
  duration,
  nap_number,
  notes,
  timestamp
FROM sleep_entries 
WHERE type = 'sleep';

-- Step 3: Insert wake events from old wake entries
-- This is more complex as we need to match wake entries to their corresponding sleep sessions
INSERT INTO wake_events (id, sleep_session_id, wake_time)
SELECT 
  we.id,
  ss.id,
  we.timestamp
FROM sleep_entries we
JOIN sleep_sessions ss ON (
  we.type = 'wake' 
  AND ss.end_time IS NOT NULL
  AND ABS(EXTRACT(EPOCH FROM (we.timestamp - ss.end_time))) < 300  -- Within 5 minutes
)
ORDER BY ABS(EXTRACT(EPOCH FROM (we.timestamp - ss.end_time))) ASC;

-- Alternative view for backward compatibility with existing frontend code
CREATE VIEW IF NOT EXISTS sleep_entries_view AS
SELECT 
  ss.id,
  'sleep' as type,
  ss.start_time as timestamp,
  ss.duration,
  ss.nap_number as "napNumber",
  ss.sleep_type as "sleepType",
  ss.notes
FROM sleep_sessions ss
UNION ALL
SELECT 
  we.id,
  'wake' as type,
  we.wake_time as timestamp,
  NULL as duration,
  NULL as "napNumber",
  NULL as "sleepType",
  NULL as notes
FROM wake_events we
ORDER BY timestamp;
