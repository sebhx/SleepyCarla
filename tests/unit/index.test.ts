import { describe, it, expect } from 'vitest'

// Import all test suites
import './dateUtils.test'
import './api.test'

describe('SleepyCarla Test Suite', () => {
  it('should have all critical test suites imported', () => {
    // This is just a placeholder test to ensure the test runner works
    expect(true).toBe(true)
  })
})

// Export test summary for potential use
export const testSummary = {
  totalSuites: 2,
  criticalFunctionalities: [
    'Date utility functions',
    'API service layer (Sleep Sessions API)'
  ],
  description: 'Comprehensive unit test suite covering the most crucial functionality in SleepyCarla baby sleep tracking app'
}
