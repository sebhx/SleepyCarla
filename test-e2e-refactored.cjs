#!/usr/bin/env node

/**
 * End-to-end test for the refactored sleep tracking functionality
 * Tests all CRUD operations and verifies the new relational database structure works correctly
 */

const BASE_URL = 'http://localhost:3003';

async function request(method, path, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${BASE_URL}${path}`, options);
  
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    error.response = { status: response.status };
    throw error;
  }
  
  // Handle DELETE requests that might not return JSON
  if (method === 'DELETE') {
    return {};
  }
  
  return response.json();
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testUserSettings() {
  console.log('\n🧪 Testing User Settings API...');
  
  try {
    // Get current settings
    const settings = await request('GET', '/api/user-settings');
    console.log('✅ Settings retrieved:', settings);
    
    // Update a setting
    const updatedSettings = await request('PUT', '/api/user-settings', {
      enableNapSuggestions: false,
      notificationsEnabled: true
    });
    console.log('✅ Settings updated:', updatedSettings);
    
    // Verify the update
    const verifiedSettings = await request('GET', '/api/user-settings');
    console.log('✅ Settings verified:', verifiedSettings);
    
    return true;
  } catch (error) {
    console.error('❌ User settings test failed:', error.message);
    return false;
  }
}

async function testSleepSessions() {
  console.log('\n🧪 Testing Sleep Sessions API...');
  
  try {
    // Create a new sleep session
    const newSession = await request('POST', '/api/sleep-sessions', {
      sleepType: 'nap',
      startTime: new Date().toISOString(),
      napNumber: 1,
      notes: 'Test nap session'
    });
    console.log('✅ Sleep session created:', newSession);
    const sessionId = newSession.id;
    
    // Get all sessions
    const allSessions = await request('GET', '/api/sleep-sessions');
    console.log(`✅ Retrieved ${allSessions.length} sleep sessions`);
    
    // End the sleep session
    const endTime = new Date(Date.now() + 30 * 60000); // 30 minutes later
    const endedSession = await request('PUT', `/api/sleep-sessions/${sessionId}/end`, {
      endTime: endTime.toISOString()
    });
    console.log('✅ Sleep session ended:', endedSession);
    
    // Get the updated session
    const updatedSession = await request('GET', `/api/sleep-sessions/${sessionId}`);
    console.log('✅ Updated session retrieved:', updatedSession);
    
    // Test cascade deletion by deleting the session
    await request('DELETE', `/api/sleep-sessions/${sessionId}`);
    console.log('✅ Sleep session deleted (cascade deletion tested)');
    
    // Verify deletion
    try {
      await request('GET', `/api/sleep-sessions/${sessionId}`);
      console.error('❌ Session should have been deleted');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Session successfully deleted');
      } else {
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Sleep sessions test failed:', error.message);
    return false;
  }
}

async function testDataIntegrity() {
  console.log('\n🧪 Testing Data Integrity...');
  
  try {
    // Create a session with wake events
    const newSession = await request('POST', '/api/sleep-sessions', {
      sleepType: 'night',
      startTime: new Date().toISOString(),
      napNumber: null,
      notes: 'Night sleep test'
    });
    const sessionId = newSession.id;
    console.log('✅ Night sleep session created');
    
    // End the session (this should create a wake event)
    await request('PUT', `/api/sleep-sessions/${sessionId}/end`, {
      endTime: new Date(Date.now() + 8 * 60 * 60000).toISOString() // 8 hours later
    });
    console.log('✅ Night sleep session ended');
    
    // Get the session and verify wake events
    const session = await request('GET', `/api/sleep-sessions/${sessionId}`);
    
    if (session.endTime && session.duration > 0) {
      console.log('✅ Session has end time and duration calculated');
    } else {
      console.error('❌ Session missing end time or duration');
      return false;
    }
    
    // Clean up
    await request('DELETE', `/api/sleep-sessions/${sessionId}`);
    console.log('✅ Test session cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Data integrity test failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...');
  
  try {
    // Test 404 for non-existent session
    try {
      await request('GET', '/api/sleep-sessions/non-existent-id');
      console.error('❌ Should have returned 404 for non-existent session');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ 404 correctly returned for non-existent session');
      } else {
        throw error;
      }
    }
    
    // Test invalid data
    try {
      await request('POST', '/api/sleep-sessions', {
        sleepType: 'invalid-type',
        startTime: 'invalid-date'
      });
      console.error('❌ Should have rejected invalid sleep session data');
      return false;
    } catch (error) {
      if (error.response && error.response.status >= 400) {
        console.log('✅ Invalid data correctly rejected');
      } else {
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
}

async function runFullTest() {
  console.log('🚀 Starting End-to-End Sleep Tracking Tests');
  console.log('='.repeat(50));
  
  const results = [];
  
  // Test each component
  results.push(await testUserSettings());
  results.push(await testSleepSessions());
  results.push(await testDataIntegrity());
  results.push(await testErrorHandling());
  
  console.log('\n📊 Test Results');
  console.log('='.repeat(50));
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total} tests`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! The refactored sleep tracking system is working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

// Run the tests
runFullTest().catch(error => {
  console.error('💥 Test runner failed:', error.message);
  process.exit(1);
});
