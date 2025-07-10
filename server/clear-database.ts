import { runQuery, getQuery } from './database-pg.js';

/**
 * Database cleanup script to clear all existing data and prepare for fresh start
 */
async function clearDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');

    // Check if tables exist
    const sleepEntriesExists = await getQuery(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'sleep_entries'
    `);

    if (sleepEntriesExists?.count > 0) {
      // Get current row count
      const currentCount = await getQuery('SELECT COUNT(*) as count FROM sleep_entries');
      console.log(`📊 Found ${currentCount?.count || 0} existing records`);

      // Clear all records
      await runQuery('DELETE FROM sleep_entries');
      console.log('✅ Cleared all records from sleep_entries table');

      // Reset auto-increment if applicable (PostgreSQL doesn't have AUTO_INCREMENT like MySQL)
      // We're using UUIDs, so no need to reset sequences
    } else {
      console.log('ℹ️ sleep_entries table does not exist yet');
    }

    // Verify cleanup
    const finalCount = await getQuery('SELECT COUNT(*) as count FROM sleep_entries');
    console.log(`✅ Database cleanup complete. Current record count: ${finalCount?.count || 0}`);

    return true;
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    throw error;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  await clearDatabase();
}

export { clearDatabase };
