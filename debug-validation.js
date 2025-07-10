// Quick debug script to understand the validation issues

import { validateSleepEntry } from './src/shared/utils/validation.js';

console.log('=== Debugging Validation Issues ===\n');

// Test 1: Future time issue
console.log('1. Future time test:');
const mockNow = new Date('2025-01-15T14:30:00.000Z');
console.log('Mocked "now":', mockNow.toISOString());

const futureTime = new Date('2025-01-15T15:00:00');
console.log('Future time:', futureTime.toISOString());
console.log('Is future time > now?', futureTime > mockNow);
console.log('Is future time > new Date()?', futureTime > new Date());

const futureEntry = {
  type: 'nap',
  startTime: futureTime,
  duration: 60
};

// Temporarily override Date constructor to simulate the mock
const originalDate = global.Date;
global.Date = function(...args) {
  if (args.length === 0) {
    return new originalDate(mockNow);
  }
  return new originalDate(...args);
};
global.Date.now = () => mockNow.getTime();

const result1 = validateSleepEntry(futureEntry);
console.log('Result:', result1);
console.log('');

// Test 2: 7 days ago issue
console.log('2. Seven days ago test:');
const sevenDaysAgo = new Date('2025-01-08T14:30:00');
console.log('Seven days ago:', sevenDaysAgo.toISOString());

const sevenDaysAgoEntry = {
  type: 'nap',
  startTime: sevenDaysAgo,
  duration: 60
};

const result2 = validateSleepEntry(sevenDaysAgoEntry);
console.log('Result:', result2);
console.log('');

// Test 3: Maximum night sleep duration
console.log('3. Maximum night sleep duration test:');
const maxNightEntry = {
  type: 'night',
  startTime: new Date('2025-01-15T19:00:00'),
  duration: 14 * 60 // Exactly 14 hours
};

const result3 = validateSleepEntry(maxNightEntry);
console.log('Result:', result3);
console.log('');

// Restore original Date
global.Date = originalDate;
