#!/usr/bin/env node

/**
 * Debug script to trace timezone conversion issue
 * Expected: UTC+2 should give 2-hour offset
 * Actual: Getting 4-hour offset (like UTC+4)
 */

console.log('🔍 Tracing Timezone Conversion Issue');
console.log('='.repeat(50));

// Step 1: Simulate user input
const formData = {
  startDate: '2025-07-10',
  startTime: '00:00'
};

console.log('\n📅 Step 1: User Input');
console.log('User enters:', formData.startDate, formData.startTime);

// Step 2: Frontend transformation (transformFormDataToApiFormat)
const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);

console.log('\n🔄 Step 2: Frontend Date Creation');
console.log('new Date(2025-07-10T00:00):');
console.log('  Local time:', startDateTime.toString());
console.log('  UTC time:', startDateTime.toISOString());
console.log('  Timezone offset:', startDateTime.getTimezoneOffset(), 'minutes');

// Step 3: Prepare API request payload
const apiPayload = {
  sleepType: 'nap',
  startTime: startDateTime,
  napNumber: 1,
  notes: 'Debug entry'
};

console.log('\n📤 Step 3: API Payload Creation');
console.log('Payload before JSON.stringify:');
console.log('  startTime type:', typeof apiPayload.startTime);
console.log('  startTime value:', apiPayload.startTime);

// Step 4: JSON serialization (what actually gets sent)
const jsonPayload = JSON.stringify(apiPayload);
const parsedPayload = JSON.parse(jsonPayload);

console.log('\n🔄 Step 4: JSON Serialization');
console.log('JSON.stringify result:', jsonPayload);
console.log('Parsed startTime:', parsedPayload.startTime);

// Step 5: What we expect vs what we're seeing
console.log('\n📊 Step 5: Expected vs Actual');
console.log('Expected (UTC+2):', '2025-07-09T22:00:00.000Z');
console.log('Actual (reported):', '2025-07-09T20:00:00.000Z');
console.log('JSON result:', parsedPayload.startTime);

// Check if there's a mismatch
const expected = '2025-07-09T22:00:00.000Z';
const actual = parsedPayload.startTime;
const difference = (new Date(expected).getTime() - new Date(actual).getTime()) / (1000 * 60 * 60);

console.log('\n🎯 Analysis:');
console.log('JSON result matches expected (UTC+2):', actual === expected);
console.log('Difference from expected:', difference, 'hours');

if (actual !== expected) {
  console.log('\n⚠️  The issue is NOT in the frontend transformation!');
  console.log('The frontend is correctly converting UTC+2 to UTC.');
  console.log('The issue must be in:');
  console.log('  - Server-side processing');
  console.log('  - Database timezone settings');
  console.log('  - API response handling');
} else {
  console.log('\n✅ Frontend transformation is correct.');
  console.log('The issue might be elsewhere in the stack.');
}

// Additional debugging: Test if environment has different timezone
console.log('\n🌍 Environment Check:');
console.log('Process timezone (TZ):', process.env.TZ || 'Not set');
console.log('Intl timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

// Test with explicit timezone
const testDate = new Date('2025-07-10T00:00:00');
console.log('\nWith explicit seconds:');
console.log('  Input: 2025-07-10T00:00:00');
console.log('  Result:', testDate.toISOString());

// Test different format
const testDate2 = new Date('2025-07-10 00:00:00');
console.log('\nWith space format:');
console.log('  Input: 2025-07-10 00:00:00');
console.log('  Result:', testDate2.toISOString());
