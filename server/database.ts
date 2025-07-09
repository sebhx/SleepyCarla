import sqlite3 from 'sqlite3';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database in server directory
const dbPath = path.join(__dirname, 'sleepycarla.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('📊 Connected to SQLite database');
    initializeDatabase();
  }
});

const initializeDatabase = () => {
  // Create sleep_entries table
  const createSleepEntriesTable = `
    CREATE TABLE IF NOT EXISTS sleep_entries (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('sleep', 'wake')),
      timestamp DATETIME NOT NULL,
      duration INTEGER,
      nap_number INTEGER CHECK (nap_number BETWEEN 1 AND 3),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create indexes for better performance
  const createIndexes = [
    'CREATE INDEX IF NOT EXISTS idx_sleep_entries_timestamp ON sleep_entries(timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_sleep_entries_type ON sleep_entries(type)',
    'CREATE INDEX IF NOT EXISTS idx_sleep_entries_date ON sleep_entries(date(timestamp))'
  ];

  db.run(createSleepEntriesTable, (err) => {
    if (err) {
      console.error('Error creating sleep_entries table:', err.message);
    } else {
      console.log('✅ Sleep entries table initialized');
      
      // Create indexes
      createIndexes.forEach((indexQuery, index) => {
        db.run(indexQuery, (err) => {
          if (err) {
            console.error(`Error creating index ${index + 1}:`, err.message);
          }
        });
      });
    }
  });
};

// Database helper functions
export const runQuery = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

export const getQuery = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

export const allQuery = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export default db;
