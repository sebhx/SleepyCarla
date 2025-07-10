import sqlite3 from 'sqlite3';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { runQuery, allQuery as pgAllQuery } from './database-pg.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to your old SQLite database
const oldDbPath = path.join(__dirname, 'sleepycarla_old.db');

interface SleepEntry {
  id: string;
  type: string;
  timestamp: string;
  duration?: number;
  nap_number?: number;
  sleep_type?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

const migrateData = async () => {
  try {
    console.log('🔄 Starting data migration from SQLite to PostgreSQL...');
    
    // Connect to SQLite database
    const sqliteDb = new sqlite3.Database(oldDbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('Error opening SQLite database:', err.message);
        return;
      }
      console.log('📊 Connected to SQLite database');
    });

    // Get all data from SQLite
    const sqliteData: SleepEntry[] = await new Promise((resolve, reject) => {
      sqliteDb.all(
        'SELECT * FROM sleep_entries ORDER BY timestamp ASC',
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as SleepEntry[]);
          }
        }
      );
    });

    console.log(`📋 Found ${sqliteData.length} entries in SQLite database`);

    // Insert data into PostgreSQL
    let successCount = 0;
    let errorCount = 0;

    for (const entry of sqliteData) {
      try {
        const sql = `
          INSERT INTO sleep_entries (id, type, timestamp, duration, nap_number, sleep_type, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `;
        
        const params = [
          entry.id,
          entry.type,
          entry.timestamp,
          entry.duration || null,
          entry.nap_number || null,
          entry.sleep_type || null,
          entry.notes || null,
          entry.created_at || new Date().toISOString(),
          entry.updated_at || new Date().toISOString()
        ];

        await runQuery(sql, params);
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`✅ Migrated ${successCount}/${sqliteData.length} entries...`);
        }
      } catch (error) {
        console.error(`❌ Error migrating entry ${entry.id}:`, error);
        errorCount++;
      }
    }

    // Verify migration
    const pgData = await pgAllQuery('SELECT COUNT(*) as count FROM sleep_entries', []);
    const pgCount = pgData[0]?.count || 0;

    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successfully migrated: ${successCount} entries`);
    console.log(`❌ Errors: ${errorCount} entries`);
    console.log(`📊 Total entries in PostgreSQL: ${pgCount}`);

    // Close SQLite connection
    sqliteDb.close((err) => {
      if (err) {
        console.error('Error closing SQLite database:', err.message);
      } else {
        console.log('🔒 SQLite database connection closed');
      }
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Run migration if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateData();
}

export default migrateData;
