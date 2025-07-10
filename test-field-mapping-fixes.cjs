#!/usr/bin/env node

/**
 * Comprehensive Test Script for Field Mapping Fixes
 * 
 * This script tests all the critical user flows that could be affected by the field mapping
 * issues identified in the analysis, particularly around sleepType vs type field usage.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Field Mapping Fixes for SleepyCarla');
console.log('='.repeat(60));

// Test configuration
const SERVER_PORT = 3001;
const BASE_URL = `http://localhost:${SERVER_PORT}`;

// Track test results
let totalTests = 0;
let passedTests = 0;
let failedTests = [];

function logTest(name, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`✅ ${name}`);
  } else {
    failedTests.push({ name, details });
    console.log(`❌ ${name}: ${details}`);
  }
}

function logSection(title) {
  console.log(`\n📋 ${title}`);
  console.log('-'.repeat(title.length + 4));
}

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = response.ok ? await response.json() : null;
    return { 
      ok: response.ok, 
      status: response.status, 
      data: responseData 
    };
  } catch (error) {
    return { 
      ok: false, 
      status: 0, 
      error: error.message 
    };
  }
}

// Helper to start the server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting server...');
    
    const serverProcess = spawn('node', ['server/server.ts'], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    let serverStarted = false;
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running on') && !serverStarted) {
        serverStarted = true;
        console.log('✅ Server started successfully');
        resolve(serverProcess);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!serverStarted) {
        console.error('❌ Server failed to start:', error);
        reject(new Error(error));
      }
    });

    // Timeout if server doesn't start
    setTimeout(() => {
      if (!serverStarted) {
        serverProcess.kill();
        reject(new Error('Server failed to start within 10 seconds'));
      }
    }, 10000);
  });
}

// Test 1: Field Mapping in Manual Entry API
async function testManualEntryFieldMapping() {
  logSection('Manual Entry Field Mapping Tests');

  // Test 1.1: Manual Nap Entry
  const napData = {
    sleepType: 'nap',
    startTime: new Date().toISOString(),
    napNumber: 1,
    notes: 'Test nap entry'
  };

  const napResponse = await makeRequest('POST', '/api/sleep-sessions', napData);
  logTest(
    'Manual nap entry with sleepType field',
    napResponse.ok && napResponse.data?.sleepType === 'nap',
    napResponse.ok ? '' : `Status: ${napResponse.status}, Error: ${napResponse.error}`
  );

  // Test 1.2: Manual Night Sleep Entry
  const nightData = {
    sleepType: 'night',
    startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    notes: 'Test night sleep'
  };

  const nightResponse = await makeRequest('POST', '/api/sleep-sessions', nightData);
  logTest(
    'Manual night sleep entry with sleepType field',
    nightResponse.ok && nightResponse.data?.sleepType === 'night',
    nightResponse.ok ? '' : `Status: ${nightResponse.status}, Error: ${nightResponse.error}`
  );

  return [napResponse.data?.id, nightResponse.data?.id];
}

// Test 2: Analytics Data Structure
async function testAnalyticsDataStructure() {
  logSection('Analytics Data Structure Tests');

  // Get sleep entries for analytics
  const entriesResponse = await makeRequest('GET', '/api/sleep-sessions/activities');
  logTest(
    'Fetch sleep activities for analytics',
    entriesResponse.ok && Array.isArray(entriesResponse.data),
    entriesResponse.ok ? '' : `Status: ${entriesResponse.status}`
  );

  if (entriesResponse.ok && entriesResponse.data.length > 0) {
    const entry = entriesResponse.data[0];
    
    // Check that entries have the expected structure for analytics
    logTest(
      'Sleep activity entries have correct structure',
      entry.hasOwnProperty('type') && 
      (entry.hasOwnProperty('sleepType') || entry.type === 'wake'),
      `Entry structure: ${JSON.stringify(Object.keys(entry))}`
    );

    // Check for sleepType field on sleep entries
    const sleepEntry = entriesResponse.data.find(e => e.type === 'sleep');
    if (sleepEntry) {
      logTest(
        'Sleep entries have sleepType field',
        sleepEntry.hasOwnProperty('sleepType') && ['nap', 'night'].includes(sleepEntry.sleepType),
        `sleepType: ${sleepEntry.sleepType}`
      );
    }
  }

  return entriesResponse.data || [];
}

// Test 3: Wake Window Calculations
async function testWakeWindowCalculations() {
  logSection('Wake Window Calculation Tests');

  // Get current wake window status
  const settingsResponse = await makeRequest('GET', '/api/user-settings');
  logTest(
    'Fetch user settings for wake windows',
    settingsResponse.ok && settingsResponse.data,
    settingsResponse.ok ? '' : `Status: ${settingsResponse.status}`
  );

  // This would normally test the wake window logic with the entries,
  // but since it's a frontend composable, we just verify the data format is correct
  const entriesResponse = await makeRequest('GET', '/api/sleep-sessions/activities');
  if (entriesResponse.ok && entriesResponse.data.length > 0) {
    const lastEntry = entriesResponse.data[entriesResponse.data.length - 1];
    logTest(
      'Last entry has proper field structure for wake windows',
      lastEntry.hasOwnProperty('type') && 
      lastEntry.hasOwnProperty('timestamp'),
      `Last entry type: ${lastEntry.type}, has timestamp: ${lastEntry.hasOwnProperty('timestamp')}`
    );
  }
}

// Test 4: Validation Function Compatibility
async function testValidationCompatibility() {
  logSection('Validation Function Compatibility Tests');

  // Test validation with old format (type field)
  try {
    const { validateSleepEntry } = require('./src/shared/utils/validation');
    
    // Test with old format
    const oldFormatEntry = {
      type: 'nap',
      startTime: new Date(),
      duration: 90,
      notes: 'Test nap'
    };

    const oldResult = validateSleepEntry(oldFormatEntry);
    logTest(
      'Validation works with old format (type field)',
      oldResult.isValid === true,
      `Validation result: ${JSON.stringify(oldResult)}`
    );

    // Test with new format
    const newFormatEntry = {
      sleepType: 'nap',
      startTime: new Date(),
      duration: 90,
      notes: 'Test nap'
    };

    const newResult = validateSleepEntry(newFormatEntry);
    logTest(
      'Validation works with new format (sleepType field)',
      newResult.isValid === true,
      `Validation result: ${JSON.stringify(newResult)}`
    );

    // Test long nap validation
    const longNapEntry = {
      type: 'nap',
      startTime: new Date(),
      duration: 5 * 60, // 5 hours
    };

    const longNapResult = validateSleepEntry(longNapEntry);
    logTest(
      'Validation catches long naps with old format',
      longNapResult.isValid === false && 
      longNapResult.errors.some(e => e.includes('unusually long')),
      `Validation errors: ${JSON.stringify(longNapResult.errors)}`
    );

  } catch (error) {
    logTest(
      'Validation function import and execution',
      false,
      `Error: ${error.message}`
    );
  }
}

// Test 5: Edit Entry Field Mapping
async function testEditEntryFieldMapping(entryIds) {
  logSection('Edit Entry Field Mapping Tests');

  if (entryIds.length === 0) {
    logTest('Edit entry test (no entries to edit)', false, 'No entries created in previous tests');
    return;
  }

  const entryId = entryIds[0];
  if (!entryId) {
    logTest('Edit entry test (invalid entry ID)', false, 'First entry ID is undefined');
    return;
  }

  // Test updating an entry
  const updateData = {
    sleepType: 'nap',
    notes: 'Updated test notes'
  };

  const updateResponse = await makeRequest('PUT', `/api/sleep-sessions/${entryId}`, updateData);
  logTest(
    'Update entry with sleepType field',
    updateResponse.ok,
    updateResponse.ok ? '' : `Status: ${updateResponse.status}, Error: ${updateResponse.error}`
  );

  // Verify the update worked
  const getResponse = await makeRequest('GET', `/api/sleep-sessions/${entryId}`);
  logTest(
    'Fetch updated entry to verify changes',
    getResponse.ok && getResponse.data?.notes === 'Updated test notes',
    getResponse.ok ? `Notes: ${getResponse.data?.notes}` : `Status: ${getResponse.status}`
  );
}

// Test 6: Cleanup - Delete Test Entries
async function cleanupTestEntries(entryIds) {
  logSection('Cleanup Test Entries');

  for (const entryId of entryIds) {
    if (entryId) {
      const deleteResponse = await makeRequest('DELETE', `/api/sleep-sessions/${entryId}`);
      logTest(
        `Delete test entry ${entryId}`,
        deleteResponse.ok || deleteResponse.status === 404,
        deleteResponse.ok ? '' : `Status: ${deleteResponse.status}`
      );
    }
  }
}

// Main test runner
async function runTests() {
  let serverProcess = null;

  try {
    // Start the server
    serverProcess = await startServer();

    // Wait a bit for server to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Run all tests
    const entryIds = await testManualEntryFieldMapping();
    await testAnalyticsDataStructure();
    await testWakeWindowCalculations();
    await testValidationCompatibility();
    await testEditEntryFieldMapping(entryIds);
    await cleanupTestEntries(entryIds.filter(Boolean));

    // Print summary
    console.log('\n📊 Test Summary');
    console.log('='.repeat(20));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests.length}`);

    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.details}`);
      });
    }

    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}%`);

    if (failedTests.length === 0) {
      console.log('\n🎉 All field mapping fixes are working correctly!');
    } else {
      console.log('\n⚠️  Some issues remain. Please review failed tests.');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    // Cleanup
    if (serverProcess) {
      console.log('\n🛑 Stopping server...');
      serverProcess.kill();
    }
    process.exit(failedTests.length === 0 ? 0 : 1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
