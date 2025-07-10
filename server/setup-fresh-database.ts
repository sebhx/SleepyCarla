import { clearDatabase } from './clear-database.js';
import { initializeDatabase } from './database-refactored.js';

/**
 * Complete database setup script that:
 * 1. Clears existing data
 * 2. Sets up new schema with settings table
 * 3. Inserts default settings
 */
async function setupFreshDatabase() {
  try {
    console.log('🚀 Starting fresh database setup...');
    
    // Step 1: Clear existing data
    console.log('📋 Step 1: Clearing existing data...');
    await clearDatabase();
    
    // Step 2: Initialize new schema
    console.log('📋 Step 2: Setting up new database schema...');
    await initializeDatabase();
    
    console.log('🎉 Fresh database setup completed successfully!');
    console.log('');
    console.log('📊 Database now includes:');
    console.log('   ✅ sleep_sessions table (for sleep data)');
    console.log('   ✅ wake_events table (linked to sleep sessions)');
    console.log('   ✅ user_settings table (for app settings)');
    console.log('   ✅ Default settings inserted');
    console.log('   ✅ Backward compatibility view');
    console.log('');
    console.log('🔗 Next steps:');
    console.log('   1. Test the new API endpoints');
    console.log('   2. Update frontend to use new settings API');
    console.log('   3. Gradually migrate to new sleep session API');
    
    return true;
  } catch (error) {
    console.error('❌ Fresh database setup failed:', error);
    throw error;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  await setupFreshDatabase();
}

export { setupFreshDatabase };
