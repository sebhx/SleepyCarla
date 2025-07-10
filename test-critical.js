#!/usr/bin/env node

/**
 * Quick test runner for critical SleepyCarla functionality
 * This script runs a focused test on the most important functions
 * to verify they work correctly after changes.
 */

import { execSync } from 'child_process';

console.log('🧪 Running Critical SleepyCarla Tests...\n');

try {
  // Run only the transform data tests (most critical for data integrity)
  console.log('✅ Testing form data transformation...');
  execSync('npm run test -- tests/unit/transformFormData.test.ts --run', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n🎉 Critical tests passed! Your changes are safe.');
  console.log('\n💡 For comprehensive testing, run: npm run test:critical');
  console.log('💡 For continuous testing, run: npm run test:watch');
  
} catch (error) {
  console.error('\n❌ Critical tests failed!');
  console.error('⚠️  Your changes may have broken core functionality.');
  console.error('\n🔧 To debug, run: npm run test:critical');
  console.error('Error details:', error.message);
  process.exit(1);
}
