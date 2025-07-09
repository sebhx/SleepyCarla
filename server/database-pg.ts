import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initializeDatabase = async () => {
  try {
    // Create sleep_entries table
    const createSleepEntriesTable = `
      CREATE TABLE IF NOT EXISTS sleep_entries (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('sleep', 'wake')),
        timestamp TIMESTAMP NOT NULL,
        duration INTEGER,
        nap_number INTEGER CHECK (nap_number BETWEEN 1 AND 3),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_sleep_entries_timestamp ON sleep_entries(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_sleep_entries_type ON sleep_entries(type)',
      'CREATE INDEX IF NOT EXISTS idx_sleep_entries_date ON sleep_entries(DATE(timestamp))'
    ];

    await pool.query(createSleepEntriesTable);
    console.log('✅ Sleep entries table initialized');

    // Create indexes
    for (const indexQuery of createIndexes) {
      try {
        await pool.query(indexQuery);
      } catch (err) {
        console.error('Error creating index:', err);
      }
    }

    console.log('📊 Connected to PostgreSQL database');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

// Database helper functions
export const runQuery = async (sql: string, params: any[] = []): Promise<any> => {
  try {
    const result = await pool.query(sql, params);
    return { 
      id: result.rows[0]?.id || null, 
      changes: result.rowCount || 0,
      rows: result.rows 
    };
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};

export const getQuery = async (sql: string, params: any[] = []): Promise<any> => {
  try {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};

export const allQuery = async (sql: string, params: any[] = []): Promise<any[]> => {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};

// Initialize database on import
initializeDatabase();

export default pool;
