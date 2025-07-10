import { allQuery, getQuery } from './server/database-refactored.js';

async function verifyTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    // Get all tables
    const tables = await allQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:', tables.map(t => t.table_name));
    
    // Check specific tables
    const expectedTables = ['sleep_sessions', 'wake_events', 'user_settings'];
    for (const tableName of expectedTables) {
      try {
        const count = await getQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`✅ ${tableName}: ${count.count} records`);
      } catch (error) {
        console.log(`❌ ${tableName}: Table not found or error - ${error.message}`);
      }
    }
    
    // Check if user_settings has default values
    const settings = await getQuery('SELECT * FROM user_settings LIMIT 1');
    if (settings) {
      console.log('⚙️ Default settings found:', settings);
    } else {
      console.log('⚠️ No default settings found');
    }
    
  } catch (error) {
    console.error('❌ Error verifying tables:', error);
  }
}

verifyTables();
