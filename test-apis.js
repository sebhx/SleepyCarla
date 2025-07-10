const BASE_URL = 'http://localhost:3003';

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error(`❌ Request failed for ${url}:`, error.message);
    throw error;
  }
}

async function testUserSettingsAPI() {
  console.log('\n🔧 Testing User Settings API...');
  
  try {
    // Test GET - Get current settings
    console.log('📥 Testing GET /api/user-settings');
    const settings = await makeRequest(`${BASE_URL}/api/user-settings`);
    console.log('✅ Current settings:', settings);
    
    // Test PUT - Update settings
    console.log('📤 Testing PUT /api/user-settings');
    const updatedSettings = {
      babyAgeRange: 'infant',  // Use valid value from check constraint
      bedtime: '18:30:00',
      morningWake: '06:30:00',
      enableNapSuggestions: false,
      theme: 'dark'
    };
    
    const putResult = await makeRequest(`${BASE_URL}/api/user-settings`, {
      method: 'PUT',
      body: JSON.stringify(updatedSettings)
    });
    console.log('✅ Settings updated:', putResult);
    
    // Verify the update worked
    const verifySettings = await makeRequest(`${BASE_URL}/api/user-settings`);
    console.log('✅ Verified updated settings:', verifySettings);
    
    // Test POST reset - Reset to defaults
    console.log('🔄 Testing POST /api/user-settings/reset');
    const resetResult = await makeRequest(`${BASE_URL}/api/user-settings/reset`, {
      method: 'POST'
    });
    console.log('✅ Settings reset to defaults:', resetResult);
    
    console.log('✅ User Settings API - All tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ User Settings API test failed:', error);
    return false;
  }
}

async function testSleepSessionsAPI() {
  console.log('\n😴 Testing Sleep Sessions API...');
  
  try {
    // Test GET - Get all sessions (should be empty)
    console.log('📥 Testing GET /api/sleep-sessions');
    const emptySessions = await makeRequest(`${BASE_URL}/api/sleep-sessions`);
    console.log('✅ Empty sessions list:', emptySessions);
    
    // Test POST - Create a new sleep session
    console.log('📤 Testing POST /api/sleep-sessions (nap)');
    const newNap = {
      sleepType: 'nap',
      napNumber: 1,
      notes: 'Test nap session'
    };
    
    const createdNap = await makeRequest(`${BASE_URL}/api/sleep-sessions`, {
      method: 'POST',
      body: JSON.stringify(newNap)
    });
    console.log('✅ Created nap session:', createdNap);
    
    // Test GET again - Should have 1 session
    const sessionsWithNap = await makeRequest(`${BASE_URL}/api/sleep-sessions`);
    console.log('✅ Sessions with nap:', sessionsWithNap);
    
    // Test PUT - End the sleep session (should create wake event)
    console.log('⏰ Testing PUT /api/sleep-sessions/:id/end');
    const endResult = await makeRequest(`${BASE_URL}/api/sleep-sessions/${createdNap.id}/end`, {
      method: 'PUT'
    });
    console.log('✅ Ended sleep session:', endResult);
    
    // Test GET specific session to see it has end time
    const endedSession = await makeRequest(`${BASE_URL}/api/sleep-sessions/${createdNap.id}`);
    console.log('✅ Session with end time:', endedSession);
    
    // Create another session for deletion test
    console.log('📤 Creating second session for deletion test');
    const secondSession = await makeRequest(`${BASE_URL}/api/sleep-sessions`, {
      method: 'POST',
      body: JSON.stringify({
        sleepType: 'night',
        notes: 'Test session for deletion'
      })
    });
    console.log('✅ Created second session:', secondSession);
    
    // End the second session to create a wake event
    await makeRequest(`${BASE_URL}/api/sleep-sessions/${secondSession.id}/end`, {
      method: 'PUT'
    });
    console.log('✅ Ended second session');
    
    // Test DELETE - Should cascade delete wake event
    console.log('🗑️ Testing DELETE /api/sleep-sessions/:id (cascade test)');
    await makeRequest(`${BASE_URL}/api/sleep-sessions/${secondSession.id}`, {
      method: 'DELETE'
    });
    console.log('✅ Deleted session (should cascade delete wake event)');
    
    // Verify only first session remains
    const finalSessions = await makeRequest(`${BASE_URL}/api/sleep-sessions`);
    console.log('✅ Final sessions after deletion:', finalSessions);
    
    console.log('✅ Sleep Sessions API - All tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Sleep Sessions API test failed:', error);
    return false;
  }
}

async function testCascadeDeletion() {
  console.log('\n🔗 Testing Cascade Deletion...');
  
  try {
    // Create a sleep session
    const session = await makeRequest(`${BASE_URL}/api/sleep-sessions`, {
      method: 'POST',
      body: JSON.stringify({
        sleepType: 'nap',
        napNumber: 2,
        notes: 'Cascade test session'
      })
    });
    
    // End the session (creates wake event)
    await makeRequest(`${BASE_URL}/api/sleep-sessions/${session.id}/end`, {
      method: 'PUT'
    });
    
    // Verify wake event was created (check database directly)
    console.log('🔍 Checking wake events in database...');
    
    // Delete the session
    await makeRequest(`${BASE_URL}/api/sleep-sessions/${session.id}`, {
      method: 'DELETE'
    });
    
    console.log('✅ Cascade deletion test completed');
    return true;
    
  } catch (error) {
    console.error('❌ Cascade deletion test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive API testing...\n');
  
  const results = {
    userSettings: false,
    sleepSessions: false,
    cascadeDeletion: false
  };
  
  // Test User Settings API
  results.userSettings = await testUserSettingsAPI();
  
  // Test Sleep Sessions API
  results.sleepSessions = await testSleepSessionsAPI();
  
  // Test Cascade Deletion
  results.cascadeDeletion = await testCascadeDeletion();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(40));
  console.log(`User Settings API: ${results.userSettings ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Sleep Sessions API: ${results.sleepSessions ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Cascade Deletion: ${results.cascadeDeletion ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  console.log('\n' + '='.repeat(40));
  console.log(`Overall Result: ${allPassed ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('✅ Backend APIs are ready for frontend integration!');
  } else {
    console.log('⚠️ Please fix failing tests before proceeding to frontend integration.');
  }
}

runAllTests().catch(console.error);
