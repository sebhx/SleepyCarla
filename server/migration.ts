/**
 * Migration script to refactor SleepyCarla database from single-table to proper relationship design
 * 
 * Updated: Now supports fresh setup without data migration
 * 
 * This script will:
 * 1. Clear existing data (if fresh setup)
 * 2. Create new tables (sleep_sessions, wake_events, user_settings)
 * 3. Create backward compatibility view
 * 4. Insert default user settings
 */

import { setupFreshDatabase } from './setup-fresh-database.js';
import { initializeDatabase as initNewDb, runQuery, getQuery, allQuery } from './database-refactored.js';

interface OldSleepEntry {
  id: string;
  type: 'sleep' | 'wake';
  timestamp: string;
  duration?: number;
  nap_number?: number;
  sleep_type?: 'nap' | 'night';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

class DatabaseMigration {
  private stats = {
    sleepEntriesMigrated: 0,
    wakeEventsMigrated: 0,
    orphanedWakeEvents: 0,
    errors: 0
  };

  async runMigration(options: {
    freshSetup?: boolean;
    backupOldTable?: boolean;
    dropOldTable?: boolean;
    validateMigration?: boolean;
  } = {}) {
    try {
      console.log('🚀 Starting SleepyCarla database migration...');
      
      // If fresh setup requested, skip migration and set up clean database
      if (options.freshSetup) {
        console.log('🧹 Fresh setup requested - clearing all data and starting clean...');
        await setupFreshDatabase();
        return { freshSetup: true, ...this.stats };
      }
      
      // Step 1: Initialize new database schema
      console.log('📋 Step 1: Initializing new database schema...');
      await initNewDb();
      
      // Step 2: Check if old data exists
      console.log('🔍 Step 2: Checking for existing data...');
      const oldDataExists = await this.checkOldDataExists();
      
      if (!oldDataExists) {
        console.log('ℹ️ No existing data found. Migration complete.');
        return this.stats;
      }
      
      // Step 3: Backup old table if requested
      if (options.backupOldTable) {
        console.log('💾 Step 3: Creating backup of old table...');
        await this.backupOldTable();
      }
      
      // Step 4: Migrate sleep entries to sleep_sessions
      console.log('🔄 Step 4: Migrating sleep entries to sleep_sessions...');
      await this.migrateSleepSessions();
      
      // Step 5: Migrate wake entries to wake_events
      console.log('🔄 Step 5: Migrating wake entries to wake_events...');
      await this.migrateWakeEvents();
      
      // Step 6: Validate migration if requested
      if (options.validateMigration) {
        console.log('✅ Step 6: Validating migration...');
        await this.validateMigration();
      }
      
      // Step 7: Drop old table if requested
      if (options.dropOldTable) {
        console.log('🗑️ Step 7: Dropping old table...');
        await this.dropOldTable();
      }
      
      console.log('🎉 Migration completed successfully!');
      console.log('📊 Migration Statistics:', this.stats);
      
      return this.stats;
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private async checkOldDataExists(): Promise<boolean> {
    try {
      const result = await getQuery(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'sleep_entries'
      `);
      
      if (result?.count === '0') {
        return false;
      }
      
      const entriesCount = await getQuery('SELECT COUNT(*) as count FROM sleep_entries');
      console.log(`Found ${entriesCount?.count || 0} entries in old format`);
      
      return parseInt(entriesCount?.count || '0') > 0;
    } catch (error) {
      console.log('Old table does not exist or is not accessible:', error);
      return false;
    }
  }

  private async backupOldTable(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupTableName = `sleep_entries_backup_${timestamp}`;
    
    await runQuery(`CREATE TABLE ${backupTableName} AS SELECT * FROM sleep_entries`);
    console.log(`✅ Backup created: ${backupTableName}`);
  }

  private async migrateSleepSessions(): Promise<void> {
    const sleepEntries = await allQuery(`
      SELECT * FROM sleep_entries 
      WHERE type = 'sleep'
      ORDER BY timestamp ASC
    `) as OldSleepEntry[];
    
    for (const entry of sleepEntries) {
      try {
        // Determine sleep type
        let sleepType = entry.sleep_type;
        if (!sleepType) {
          sleepType = (entry.nap_number && entry.nap_number > 0) ? 'nap' : 'night';
        }
        
        // Calculate end time if we have duration
        let endTime: Date | null = null;
        if (entry.duration && entry.duration > 0) {
          const startTime = new Date(entry.timestamp);
          endTime = new Date(startTime.getTime() + (entry.duration * 60 * 1000));
        }
        
        await runQuery(`
          INSERT INTO sleep_sessions (
            id, sleep_type, start_time, end_time, duration, nap_number, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `, [
          entry.id,
          sleepType,
          entry.timestamp,
          endTime?.toISOString() || null,
          entry.duration || null,
          entry.nap_number || null,
          entry.notes || null,
          entry.created_at || entry.timestamp,
          entry.updated_at || entry.timestamp
        ]);
        
        this.stats.sleepEntriesMigrated++;
        
      } catch (error) {
        console.error(`Error migrating sleep entry ${entry.id}:`, error);
        this.stats.errors++;
      }
    }
    
    console.log(`✅ Migrated ${this.stats.sleepEntriesMigrated} sleep sessions`);
  }

  private async migrateWakeEvents(): Promise<void> {
    const wakeEntries = await allQuery(`
      SELECT * FROM sleep_entries 
      WHERE type = 'wake'
      ORDER BY timestamp ASC
    `) as OldSleepEntry[];
    
    for (const wakeEntry of wakeEntries) {
      try {
        // Find the corresponding sleep session
        // Look for sleep sessions that ended around the same time as this wake entry
        const matchingSleepSession = await getQuery(`
          SELECT id FROM sleep_sessions 
          WHERE end_time IS NOT NULL
          AND ABS(EXTRACT(EPOCH FROM (end_time - $1))) < 300
          ORDER BY ABS(EXTRACT(EPOCH FROM (end_time - $1))) ASC
          LIMIT 1
        `, [wakeEntry.timestamp]);
        
        if (matchingSleepSession) {
          await runQuery(`
            INSERT INTO wake_events (id, sleep_session_id, wake_time, created_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO NOTHING
          `, [
            wakeEntry.id,
            matchingSleepSession.id,
            wakeEntry.timestamp,
            wakeEntry.created_at || wakeEntry.timestamp
          ]);
          
          this.stats.wakeEventsMigrated++;
        } else {
          console.warn(`⚠️ Orphaned wake entry found: ${wakeEntry.id} at ${wakeEntry.timestamp}`);
          this.stats.orphanedWakeEvents++;
        }
        
      } catch (error) {
        console.error(`Error migrating wake entry ${wakeEntry.id}:`, error);
        this.stats.errors++;
      }
    }
    
    console.log(`✅ Migrated ${this.stats.wakeEventsMigrated} wake events`);
    if (this.stats.orphanedWakeEvents > 0) {
      console.log(`⚠️ Found ${this.stats.orphanedWakeEvents} orphaned wake events`);
    }
  }

  private async validateMigration(): Promise<void> {
    // Count records in old vs new tables
    const oldSleepCount = await getQuery('SELECT COUNT(*) as count FROM sleep_entries WHERE type = \'sleep\'');
    const oldWakeCount = await getQuery('SELECT COUNT(*) as count FROM sleep_entries WHERE type = \'wake\'');
    
    const newSleepCount = await getQuery('SELECT COUNT(*) as count FROM sleep_sessions');
    const newWakeCount = await getQuery('SELECT COUNT(*) as count FROM wake_events');
    
    console.log('📊 Migration Validation:');
    console.log(`   Sleep entries: ${oldSleepCount?.count} → ${newSleepCount?.count}`);
    console.log(`   Wake entries: ${oldWakeCount?.count} → ${newWakeCount?.count}`);
    
    // Test the backward compatibility view
    const viewCount = await getQuery('SELECT COUNT(*) as count FROM sleep_entries_view');
    const originalTotal = parseInt(oldSleepCount?.count || '0') + parseInt(oldWakeCount?.count || '0');
    
    console.log(`   Compatibility view: ${viewCount?.count} (original: ${originalTotal})`);
    
    if (parseInt(viewCount?.count || '0') !== originalTotal) {
      console.warn('⚠️ Compatibility view count mismatch - some data may be missing');
    } else {
      console.log('✅ Validation passed');
    }
  }

  private async dropOldTable(): Promise<void> {
    await runQuery('DROP TABLE IF EXISTS sleep_entries');
    console.log('✅ Old table dropped');
  }

  // Rollback method in case something goes wrong
  async rollback(backupTableName?: string): Promise<void> {
    try {
      console.log('🔄 Rolling back migration...');
      
      // Drop new tables
      await runQuery('DROP TABLE IF EXISTS wake_events CASCADE');
      await runQuery('DROP TABLE IF EXISTS sleep_sessions CASCADE');
      await runQuery('DROP VIEW IF EXISTS sleep_entries_view');
      
      // Restore from backup if provided
      if (backupTableName) {
        await runQuery(`CREATE TABLE sleep_entries AS SELECT * FROM ${backupTableName}`);
        console.log('✅ Restored from backup');
      }
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new DatabaseMigration();
  
  const args = process.argv.slice(2);
  const options = {
    freshSetup: args.includes('--fresh'),
    backupOldTable: args.includes('--backup'),
    dropOldTable: args.includes('--drop-old'),
    validateMigration: args.includes('--validate') || true // Default to true
  };
  
  if (args.includes('--rollback')) {
    const backupTable = args[args.indexOf('--rollback') + 1];
    await migration.rollback(backupTable);
  } else {
    await migration.runMigration(options);
  }
}

export { DatabaseMigration };
