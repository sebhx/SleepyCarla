// Debug the 7 days ago calculation
const mockNow = new Date('2025-01-15T14:30:00.000Z');
const testDate = new Date('2025-01-08T14:30:00');

console.log('Mock now:', mockNow.toISOString());
console.log('Test date:', testDate.toISOString());

const sevenDaysAgo = new Date(mockNow);
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
console.log('Seven days ago boundary:', sevenDaysAgo.toISOString());

console.log('Is test date < boundary?', testDate < sevenDaysAgo);
console.log('Is test date >= boundary?', testDate >= sevenDaysAgo);

// Check the difference in milliseconds
const diffMs = mockNow.getTime() - testDate.getTime();
const diffDays = diffMs / (1000 * 60 * 60 * 24);
console.log('Difference in days:', diffDays);
