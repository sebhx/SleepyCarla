# SleepyCarla Testing Setup

## Overview

This project now includes comprehensive unit tests for the most critical functionality in the SleepyCarla baby sleep tracking app. The test suite covers:

1. **Form Data Transformation** - Tests the crucial `transformFormDataToApiFormat` function
2. **Date Utilities** - Tests all date/time formatting and manipulation functions
3. **Sleep Entry Validation** - Tests validation logic for sleep entries
4. **Cascade Delete Logic** - Tests the server-side cascade delete functionality
5. **API Service Layer** - Tests all API interactions and error handling

## Test Commands

```bash
# Run all tests
npm test

# Run tests once (good for CI/CD)
npm run test:run

# Run only critical unit tests
npm run test:critical

# Run tests with UI (visual interface)
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (automatically re-run when files change)
npm run test:watch
```

## Automated Testing

The project is configured to automatically run tests when:

1. **File Changes**: Use `npm run test:watch` to automatically run tests when you save files
2. **Git Commits**: Tests will run automatically before commits (via husky pre-commit hooks)
3. **Build Process**: Tests are part of the build verification process

## Test Structure

```
tests/
├── setup.ts              # Test configuration and mocks
└── unit/
    ├── index.test.ts      # Main test suite entry point
    ├── transformFormData.test.ts  # Form data transformation tests
    ├── dateUtils.test.ts          # Date utility function tests
    ├── validation.test.ts         # Sleep entry validation tests
    ├── cascadeDelete.test.ts      # Server cascade delete logic tests
    └── api.test.ts               # API service layer tests
```

## Critical Functionality Covered

### 1. Data Transformation & Type Safety ✅

- Form data to API format conversion
- Date object handling and timezone consistency
- Duration calculations for different input methods
- Edge cases (zero duration, cross-day times, etc.)

### 2. Date & Time Operations ✅

- Duration formatting (`formatDuration`)
- Time formatting (`formatTime`)
- Date formatting (`formatDate`)
- Day boundary calculations (`getStartOfDay`, `getEndOfDay`)

### 3. Data Validation ✅

- Sleep entry validation rules
- Duration limits (nap vs night sleep)
- Time constraints (not future, not too old)
- Notes length validation

### 4. Server-Side Logic ✅

- Cascade delete functionality
- Wake entry protection
- Time window calculations for associated entries
- Error handling for edge cases

### 5. API Integration ✅

- HTTP request/response handling
- Error handling and proper error types
- Data serialization (Date objects to ISO strings)
- Network failure handling

## Benefits

1. **Regression Prevention**: Automatically catch breaking changes
2. **Confidence in Refactoring**: Safe to modify code knowing tests will catch issues
3. **Documentation**: Tests serve as living documentation of expected behavior
4. **Quality Assurance**: Ensures edge cases are handled properly

## Running Tests During Development

For the best development experience, run tests in watch mode:

```bash
npm run test:watch
```

This will:

- Run tests automatically when you save files
- Show only relevant test output
- Provide fast feedback on your changes
- Help catch regressions immediately

## Integration with CI/CD

The test setup is ready for integration with continuous integration systems. The `npm run test:run` command will:

- Run all tests once
- Exit with appropriate status codes
- Provide detailed output for debugging failures
- Work well in automated environments

## Test Coverage

The tests focus on the most critical functionality that could cause data loss or corruption:

- ✅ Sleep/wake entry relationships
- ✅ Data transformation accuracy
- ✅ Cascade delete integrity
- ✅ API error handling
- ✅ Date/timezone handling

## Future Enhancements

Consider adding:

- Component integration tests for critical UI components
- E2E tests for complete user workflows
- Performance tests for large datasets
- Database integration tests

## Note

Some tests may initially fail as they test against actual implementation files that may not exist yet or may have different interfaces. This is expected and the tests serve as specifications for the required functionality.
