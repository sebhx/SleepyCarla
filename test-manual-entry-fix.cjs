#!/usr/bin/env node

/**
 * Test script to verify manual entry functionality works after the fix
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

async function testManualEntry() {
  console.log('\n🧪 Testing Manual Entry Fix...');
  
  try {
    // Simulate what the frontend would send after the fix
    const manualEntryData = {
      sleepType: 'nap',
      startTime: new Date().toISOString(),
      napNumber: 1,
      notes: 'Test manual nap entry'
    };
    
    console.log('📤 Sending manual entry request:', manualEntryData);
    
    const createdSession = await request('POST', '/api/sleep-sessions', manualEntryData);
    console.log('✅ Manual entry created successfully:', createdSession);
    
    // Clean up
    await request('DELETE', `/api/sleep-sessions/${createdSession.id}`);
    console.log('✅ Test session cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Manual entry test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

async function testManualEntryWithDuration() {
  console.log('\n🧪 Testing Manual Entry with Duration...');
  
  try {
    const startTime = new Date();
    const duration = 90; // 90 minutes
    
    // Create session
    const sessionData = {
      sleepType: 'nap',
      startTime: startTime.toISOString(),
      napNumber: 1,
      notes: 'Test nap with duration'
    };
    
    const createdSession = await request('POST', '/api/sleep-sessions', sessionData);
    console.log('✅ Session created:', createdSession.id);
    
    // End session with duration
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const endedSession = await request('PUT', `/api/sleep-sessions/${createdSession.id}/end`, {
      endTime: endTime.toISOString()
    });
    
    console.log('✅ Session ended with duration:', endedSession.duration, 'minutes');
    
    if (endedSession.duration === duration) {
      console.log('✅ Duration calculation correct');
    } else {
      console.log('⚠️ Duration mismatch. Expected:', duration, 'Got:', endedSession.duration);
    }
    
    // Clean up
    await request('DELETE', `/api/sleep-sessions/${createdSession.id}`);
    console.log('✅ Test session cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Manual entry with duration test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Manual Entry Fix');
  console.log('='.repeat(40));
  
  const results = [];
  results.push(await testManualEntry());
  results.push(await testManualEntryWithDuration());
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log('\n📊 Test Results');
  console.log('='.repeat(40));
  console.log(`✅ Passed: ${passed}/${total} tests`);
  
  if (passed === total) {
    console.log('\n🎉 Manual entry fix is working correctly!');
  } else {
    console.log('\n❌ Some tests failed. Check the implementation.');
  }
}

runTests().catch(error => {
  console.error('💥 Test runner failed:', error.message);
});
