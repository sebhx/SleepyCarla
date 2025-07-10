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

async function testTimezoneHandling() {
  try {
    console.log('🧪 Testing timezone handling after schema fix...\n');
    
    // Test the manual entry scenario: User enters "2025-07-10 00:00" in UTC+2
    const userInput = '2025-07-10T00:00'; // What user types
    const localDate = new Date(userInput); // Creates date in local timezone
    const utcString = localDate.toISOString(); // Converts to UTC string for API
    
    console.log('User input (local):', userInput);
    console.log('Frontend Date object:', localDate);
    console.log('API payload (UTC):', utcString);
    
    // Simulate what the API does - insert the UTC string
    const testId = 'test-timezone-' + Date.now();
    await pool.query(`
      INSERT INTO sleep_sessions (id, sleep_type, start_time, notes)
      VALUES ($1, 'nap', $2, 'Timezone test entry')
    `, [testId, utcString]);
    
    console.log('\n✅ Inserted test record');
    
    // Query it back and see how PostgreSQL handles it
    const result = await pool.query(`
      SELECT 
        id,
        start_time,
        start_time AT TIME ZONE 'UTC' as utc_time,
        start_time AT TIME ZONE 'Europe/Helsinki' as helsinki_time,
        start_time AT TIME ZONE 'Europe/Berlin' as berlin_time
      FROM sleep_sessions 
      WHERE id = $1
    `, [testId]);
    
    console.log('\n📊 Query results:');
    console.log(result.rows[0]);
    
    // Simulate what the frontend receives
    const apiResponse = {
      ...result.rows[0],
      start_time: undefined,
      startTime: result.rows[0].start_time.toISOString()
    };
    
    console.log('\n📤 API response (what frontend receives):');
    console.log('startTime:', apiResponse.startTime);
    
    // Simulate frontend parsing
    const frontendDate = new Date(apiResponse.startTime);
    console.log('\n💻 Frontend parsing:');
    console.log('Parsed Date object:', frontendDate);
    console.log('Local time display:', frontendDate.toLocaleString());
    console.log('Time only:', frontendDate.toLocaleTimeString());
    
    // Clean up test record
    await pool.query('DELETE FROM sleep_sessions WHERE id = $1', [testId]);
    console.log('\n🧹 Cleaned up test record');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testTimezoneHandling();
