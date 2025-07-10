import pkg from 'pg';
const { Pool } = pkg;

// Production-ready database connection with connection pooling
const pool = new Pool({
  // Use DATABASE_URL for production (Railway/Heroku style)
  connectionString: process.env.DATABASE_URL,
  
  // Fallback to individual settings for development
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sleepycarla',
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Connection pool settings for production
  max: process.env.NODE_ENV === 'production' ? 10 : 4,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  
  // Logging in development
  log: process.env.NODE_ENV === 'development' ? console.log : undefined
});

const initializeRefactoredDatabase = async () => {
  try {
    console.log('🔄 Initializing refactored database schema...');

    // Create sleep_sessions table
    const createSleepSessionsTable = `
      CREATE TABLE IF NOT EXISTS sleep_sessions (
        id TEXT PRIMARY KEY,
        sleep_type TEXT NOT NULL CHECK (sleep_type IN ('nap', 'night')),
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ,
        duration INTEGER,
        nap_number INTEGER CHECK (nap_number BETWEEN 1 AND 3),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create wake_events table with foreign key
    const createWakeEventsTable = `
      CREATE TABLE IF NOT EXISTS wake_events (
        id TEXT PRIMARY KEY,
        sleep_session_id TEXT NOT NULL,
        wake_time TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sleep_session_id) REFERENCES sleep_sessions(id) ON DELETE CASCADE
      )
    `;

    // Create user_settings table
    const createUserSettingsTable = `
      CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        baby_age_range TEXT NOT NULL CHECK (baby_age_range IN ('newborn', 'infant', 'older-infant', 'toddler', 'young-toddler', 'toddler-plus')),
        baby_exact_age_weeks INTEGER,
        bedtime TIME NOT NULL DEFAULT '19:00',
        morning_wake TIME NOT NULL DEFAULT '07:00',
        enable_nap_suggestions BOOLEAN NOT NULL DEFAULT true,
        notifications_enabled BOOLEAN NOT NULL DEFAULT false,
        theme TEXT NOT NULL CHECK (theme IN ('light', 'dark', 'auto')) DEFAULT 'light',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Insert default settings if none exist
    const insertDefaultSettings = `
      INSERT INTO user_settings (id, baby_age_range, bedtime, morning_wake, enable_nap_suggestions, notifications_enabled, theme)
      VALUES ('default', 'older-infant', '19:00', '07:00', true, false, 'light')
      ON CONFLICT (id) DO NOTHING
    `;

    // Create indexes for performance
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_sleep_sessions_start_time ON sleep_sessions(start_time)',
      'CREATE INDEX IF NOT EXISTS idx_sleep_sessions_type ON sleep_sessions(sleep_type)',
      'CREATE INDEX IF NOT EXISTS idx_sleep_sessions_date ON sleep_sessions(DATE(start_time))',
      'CREATE INDEX IF NOT EXISTS idx_wake_events_wake_time ON wake_events(wake_time)',
      'CREATE INDEX IF NOT EXISTS idx_wake_events_sleep_session ON wake_events(sleep_session_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_settings_updated ON user_settings(updated_at)'
    ];

    // Create backward compatibility view
    const createCompatibilityView = `
      CREATE OR REPLACE VIEW sleep_entries_view AS
      SELECT 
        ss.id,
        'sleep' as type,
        ss.start_time as timestamp,
        ss.duration,
        ss.nap_number as nap_number,
        ss.sleep_type as sleep_type,
        ss.notes
      FROM sleep_sessions ss
      UNION ALL
      SELECT 
        we.id,
        'wake' as type,
        we.wake_time as timestamp,
        NULL as duration,
        NULL as nap_number,
        NULL as sleep_type,
        NULL as notes
      FROM wake_events we
      ORDER BY timestamp
    `;

    // Execute table creation
    await pool.query(createSleepSessionsTable);
    console.log('✅ Sleep sessions table created');

    await pool.query(createWakeEventsTable);
    console.log('✅ Wake events table created');

    await pool.query(createUserSettingsTable);
    console.log('✅ User settings table created');

    // Insert default settings
    await pool.query(insertDefaultSettings);
    console.log('✅ Default settings inserted');

    // Create indexes
    for (const indexQuery of createIndexes) {
      try {
        await pool.query(indexQuery);
      } catch (err) {
        console.error('Error creating index:', err);
      }
    }
    console.log('✅ Indexes created');

    // Create compatibility view
    await pool.query(createCompatibilityView);
    console.log('✅ Backward compatibility view created');

    console.log('🎉 Refactored database schema initialized successfully');
  } catch (err) {
    console.error('Error initializing refactored database:', err);
    throw err;
  }
};

// Migration function to convert existing data
const migrateExistingData = async () => {
  try {
    console.log('🔄 Starting data migration...');

    // Check if we have existing data in old format
    const oldDataExists = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'sleep_entries'
    `);

    if (oldDataExists.rows[0].count === '0') {
      console.log('ℹ️ No existing data to migrate');
      return;
    }

    // Migrate sleep entries to sleep_sessions
    const migrateSleepSessions = `
      INSERT INTO sleep_sessions (id, sleep_type, start_time, end_time, duration, nap_number, notes, created_at, updated_at)
      SELECT 
        id,
        COALESCE(sleep_type, CASE WHEN nap_number > 0 THEN 'nap' ELSE 'night' END),
        timestamp,
        CASE 
          WHEN duration IS NOT NULL AND duration > 0 
          THEN timestamp + (duration || ' minutes')::INTERVAL
          ELSE NULL 
        END,
        duration,
        nap_number,
        notes,
        COALESCE(created_at, timestamp),
        COALESCE(updated_at, timestamp)
      FROM sleep_entries 
      WHERE type = 'sleep'
      ON CONFLICT (id) DO NOTHING
    `;

    const sleepResult = await pool.query(migrateSleepSessions);
    console.log(`✅ Migrated ${sleepResult.rowCount} sleep sessions`);

    // Migrate wake entries to wake_events
    // Match wake entries to their corresponding sleep sessions
    const migrateWakeEvents = `
      INSERT INTO wake_events (id, sleep_session_id, wake_time, created_at)
      SELECT DISTINCT ON (we.id)
        we.id,
        ss.id,
        we.timestamp,
        COALESCE(we.created_at, we.timestamp)
      FROM sleep_entries we
      JOIN sleep_sessions ss ON (
        we.type = 'wake' 
        AND ss.end_time IS NOT NULL
        AND ABS(EXTRACT(EPOCH FROM (we.timestamp - ss.end_time))) < 300
      )
      ORDER BY we.id, ABS(EXTRACT(EPOCH FROM (we.timestamp - ss.end_time))) ASC
      ON CONFLICT (id) DO NOTHING
    `;

    const wakeResult = await pool.query(migrateWakeEvents);
    console.log(`✅ Migrated ${wakeResult.rowCount} wake events`);

    console.log('🎉 Data migration completed successfully');
  } catch (err) {
    console.error('Error during data migration:', err);
    throw err;
  }
};

// Database helper functions (reuse existing pattern)
export const runQuery = async (sql: string, params: any[] = []): Promise<any> => {
  try {
    const result = await pool.query(sql, params);
    return { rows: result.rows, rowCount: result.rowCount, changes: result.rowCount };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const getQuery = async (sql: string, params: any[] = []): Promise<any> => {
  const result = await runQuery(sql, params);
  return result.rows[0] || null;
};

export const allQuery = async (sql: string, params: any[] = []): Promise<any[]> => {
  const result = await runQuery(sql, params);
  return result.rows || [];
};

// Initialize and migrate
export const initializeDatabase = async () => {
  await initializeRefactoredDatabase();
  // Uncomment below to run migration (only when ready)
  // await migrateExistingData();
};

export default pool;
