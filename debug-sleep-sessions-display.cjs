#!/usr/bin/env node

/**
 * Debug script for "Today's Sleep Sessions" display issue
 */

console.log('🔍 Debugging Sleep Sessions Display Issue');
console.log('='.repeat(50));

// Current date analysis
const now = new Date();
console.log('\n📅 Date Analysis:');
console.log('Current time:', now.toISOString());
console.log('Current local time:', now.toString());

// Today's range calculation (how the app calculates it)
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

console.log('Today start:', todayStart.toISOString());
console.log('Today end:', todayEnd.toISOString());

// Test data analysis
const testData = [
    {
        "id": "2b78f95c-307e-418c-bf99-331e5e09a1f1",
        "sleepType": "nap",
        "startTime": "2025-07-09T20:16:39.751Z",
        "endTime": "2025-07-09T20:16:39.761Z",
        "duration": 120,
        "napNumber": 1,
        "notes": "Test nap session",
        "createdAt": "2025-07-09T22:16:39.752Z",
        "updatedAt": "2025-07-09T22:16:39.762Z"
    }
];

console.log('\n📊 Test Data Analysis:');
testData.forEach((session, index) => {
    const startTime = new Date(session.startTime);
    const isInRange = startTime >= todayStart && startTime <= todayEnd;
    
    console.log(`\nSession ${index + 1}:`);
    console.log(`  Start time: ${startTime.toISOString()}`);
    console.log(`  Local time: ${startTime.toString()}`);
    console.log(`  Is in today's range: ${isInRange}`);
    console.log(`  Time difference from today: ${Math.round((now.getTime() - startTime.getTime()) / (1000 * 60 * 60))} hours`);
});

// Helper to create a new entry for today
console.log('\n🔧 To create a test entry for today, use this command:');

const createEntryPayload = {
    sleepType: "nap",
    startTime: now.toISOString(),
    napNumber: 1,
    notes: "Debug test entry for today"
};

console.log('\nPowerShell command:');
console.log(`Invoke-RestMethod -Uri "http://localhost:3001/api/sleep-sessions" -Method POST -ContentType "application/json" -Body '${JSON.stringify(createEntryPayload)}'`);

console.log('\nCurl command:');
console.log(`curl -X POST http://localhost:3001/api/sleep-sessions -H "Content-Type: application/json" -d '${JSON.stringify(createEntryPayload)}'`);

// Test the filtering logic directly
console.log('\n🧪 Testing Filter Logic:');
const mockEntries = [
    {
        id: '1',
        type: 'sleep',
        timestamp: new Date('2025-07-09T20:16:39.751Z'), // Yesterday
        sleepType: 'nap'
    },
    {
        id: '2', 
        type: 'sleep',
        timestamp: now, // Today
        sleepType: 'nap'
    }
];

console.log('\nMock entries:');
mockEntries.forEach((entry, index) => {
    const isInRange = entry.timestamp >= todayStart && entry.timestamp <= todayEnd;
    console.log(`  Entry ${index + 1}: ${entry.timestamp.toISOString()} - In range: ${isInRange}`);
});

const filteredEntries = mockEntries.filter((entry) => {
    return entry.timestamp >= todayStart && entry.timestamp <= todayEnd;
});

console.log(`\nFiltered entries count: ${filteredEntries.length}`);
console.log('\n✅ If you see 1 filtered entry, the logic is working correctly.');
console.log('📝 The issue is likely that your test data is from yesterday (July 9th).');
console.log('🎯 Solution: Create a new sleep session for today using the commands above.');
