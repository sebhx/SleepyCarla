import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sleepycarla',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDB() {
  try {
    console.log('🔍 Checking database configuration...\n');
    
    // Check PostgreSQL timezone settings
    const timezoneResult = await pool.query('SHOW timezone');
    console.log('Database timezone:', timezoneResult.rows[0]);
    
    // Check current timestamp
    const nowResult = await pool.query('SELECT NOW() as current_time');
    console.log('Database current time:', nowResult.rows[0]);
    
    // Check table schema for sleep_sessions
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'sleep_sessions' 
      ORDER BY ordinal_position
    `);
    console.log('\nSleep sessions table schema:');
    console.log(schemaResult.rows);
    
    // Check if there are any existing records and their timestamps
    const sampleResult = await pool.query('SELECT id, start_time, end_time, sleep_type FROM sleep_sessions ORDER BY start_time DESC LIMIT 5');
    console.log('\nSample records (most recent):');
    console.log(sampleResult.rows);
    
    // Test timezone conversion
    const testTime = '2025-01-20T10:00:00.000Z'; // UTC time
    const localTimeResult = await pool.query(`
      SELECT 
        $1::timestamp as input_time,
        $1::timestamp AT TIME ZONE 'UTC' as utc_time,
        $1::timestamp AT TIME ZONE 'Europe/Helsinki' as helsinki_time
    `, [testTime]);
    console.log('\nTimezone conversion test:');
    console.log(localTimeResult.rows[0]);
    
    await pool.end();
  } catch (error) {
    console.error('Database check error:', error.message);
    console.error(error.stack);
  }
}

checkDB();
