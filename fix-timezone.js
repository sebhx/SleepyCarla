import pkg from 'pg';
import fs from 'fs';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sleepycarla',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixTimezoneSchema() {
  try {
    console.log('🔧 Fixing database schema for proper timezone handling...\n');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('./fix-timezone-schema.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement) {
        console.log(`Executing: ${trimmedStatement.substring(0, 50)}...`);
        await pool.query(trimmedStatement);
      }
    }
    
    console.log('\n✅ Database schema updated successfully!');
    
    // Verify the new schema
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'sleep_sessions' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 New schema:');
    console.log(schemaResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
    console.error(error.stack);
  }
}

fixTimezoneSchema();
