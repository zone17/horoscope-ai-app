# Testing Strategy

This document outlines the testing approach for the Today's Horoscope application, including unit, integration, and end-to-end testing methodologies.

## Overview

The application uses Jest as the primary testing framework, with additional libraries to support testing React components and utilities. Tests are written to ensure that:

1. Individual components work correctly in isolation
2. Feature flag toggling functions as expected
3. Components integrate properly with each other
4. Business logic produces the correct outputs

## Test Types

### Unit Tests

Unit tests verify that individual functions, components, and utilities work correctly in isolation.

- **Location**: Files with `.test.ts` or `.test.tsx` suffix adjacent to the files they test
- **Focus**: Testing a single function, component, or utility in isolation
- **Mocking**: External dependencies are mocked

### Integration Tests

Integration tests verify that multiple components or functions work correctly together.

- **Location**: Files with `.integration.test.ts` or `.integration.test.tsx` suffix
- **Focus**: Testing the interaction between multiple components or functions
- **Mocking**: Only external services are mocked, not internal dependencies

### End-to-End Tests (Future)

End-to-end tests verify that the entire application works correctly from a user's perspective.

- **Tools**: Cypress or Playwright (to be implemented)
- **Focus**: Testing complete user flows

## Testing Environment Setup

### Jest Configuration

The application uses Jest with the following configuration:

- **Test Environment**: `jest-environment-jsdom` for DOM testing
- **Transform**: Uses SWC for faster test execution
- **Coverage**: Configured to collect coverage from all source files excluding tests
- **Setup Files**: `jest.setup.js` for global test setup

### Mocking Strategies

1. **API Mocking**: All external API calls are mocked using Jest's mocking capabilities
2. **Environment Variables**: Test-specific environment variables are set in `jest.setup.js`
3. **Feature Flags**: Feature flags are mocked to test different application configurations
4. **Time/Date Functions**: Date functions are mocked to test timezone-specific behavior

## Feature-Specific Tests

### Schema Markup

The schema markup implementation is tested at multiple levels:

#### 1. Schema Generator Unit Tests

File: `src/utils/schema-generator.test.ts`

These tests verify that:
- Each schema type is correctly generated with proper structure
- The correct number of schemas are generated based on input data
- Empty input is handled gracefully

Example:
```javascript
it('should include Website schema with correct structure', () => {
  const schemas = generateSchemas(zodiacSigns, horoscopes);
  
  const websiteSchema = schemas.find(schema => schema['@type'] === 'WebSite');
  expect(websiteSchema).toBeDefined();
  expect(websiteSchema?.name).toBe("Today's Horoscope");
  expect(websiteSchema?.url).toBe("https://www.gettodayshoroscope.com");
  expect(websiteSchema?.potentialAction?.['@type']).toBe('SearchAction');
});
```

#### 2. Schema Generator Regression Tests

File: `src/utils/schema-generator.regression.test.ts`

These critical regression tests ensure that our schema generation consistently:
- Produces valid schema markup for SEO
- Includes all required schema types (Website, BreadcrumbList, Article)
- Handles different data scenarios correctly
- Maintains the correct structure according to schema.org standards

This regression test suite specifically focuses on the schema logic without UI dependencies,
making it more stable and reliable for continuous integration.

#### 3. Feature Flag Integration Tests

File: `src/components/seo/SchemaMarkup.integration.test.ts`

These tests verify that:
- The component respects the feature flag setting
- Schema content is properly generated with actual data
- All required schema types are included

Example:
```javascript
it('should handle the feature flag correctly', () => {
  // Test when flag is disabled
  (isFeatureEnabled as jest.Mock).mockReturnValue(false);
  const isEnabled = isFeatureEnabled(FEATURE_FLAGS.USE_SCHEMA_MARKUP, false);
  expect(isEnabled).toBe(false);
  
  // Test when flag is enabled
  (isFeatureEnabled as jest.Mock).mockReturnValue(true);
  const isEnabledNow = isFeatureEnabled(FEATURE_FLAGS.USE_SCHEMA_MARKUP, false);
  expect(isEnabledNow).toBe(true);
});
```

### Timezone-Aware Content Generation

The timezone functionality is tested through various test files:

#### 1. Timezone Utility Tests

File: `src/utils/timezone.test.ts`

These tests verify that:
- Local date is correctly determined based on timezone
- Date formatting functions work as expected
- Fallback to UTC works when timezone is unavailable

Example:
```javascript
it('should return correct local date for a given timezone', () => {
  // Mock Date to a fixed value
  jest.useFakeTimers().setSystemTime(new Date('2023-05-15T00:00:00Z'));
  
  // Test different timezone offsets
  expect(getLocalDate('America/New_York')).toBe('2023-05-14');
  expect(getLocalDate('Asia/Tokyo')).toBe('2023-05-15');
  expect(getLocalDate('Europe/London')).toBe('2023-05-15');
});
```

#### 2. Timezone Hooks Tests

File: `src/hooks/useUserTimezone.test.ts`

These tests verify that:
- The hook correctly detects user timezone
- Fallback behavior works as expected
- The hook properly handles timezone changes

#### 3. Content Generation Integration Tests

File: `src/app/api/horoscopes/route.integration.test.ts`

These tests verify that:
- The API generates content based on the provided timezone
- Content is consistent for the same date and timezone
- Different timezones for the same UTC date get different content when appropriate

### Lunar Calendar Ordering

The lunar calendar ordering is tested in:

File: `src/utils/zodiac-order.test.ts`

These tests verify that:
- Signs are correctly ordered based on the lunar calendar when enabled
- The feature flag correctly toggles between solar and lunar ordering
- Both ordering systems contain all zodiac signs

### Redis Caching

The Redis caching functionality is tested in:

#### 1. Redis Client Tests

File: `src/lib/redis.test.ts`

These tests verify that:
- Cache operations (get, set, delete) work correctly
- TTL is properly applied
- Error handling works as expected

#### 2. API Route Cache Integration Tests

File: `src/app/api/horoscopes/cache.integration.test.ts`

These tests verify that:
- API responses are cached correctly
- Cached responses are retrieved instead of regenerating content
- Cache invalidation works as expected

### OpenAI Integration

The OpenAI integration is tested in:

#### 1. OpenAI Client Tests

File: `src/lib/openai.test.ts`

These tests verify that:
- API calls to OpenAI are correctly formatted
- Error handling and retries work as expected
- Model selection logic works correctly

#### 2. Content Generation Tests

File: `src/utils/horoscope-generator.test.ts`

These tests verify that:
- Horoscope generation functions correctly transform OpenAI responses
- Philosopher style rotation works as expected
- Error states are handled gracefully

## Testing Next.js Components

### Server Components

For testing React Server Components:

- **Mock Data Fetching**: Server actions and data fetching methods are mocked
- **Render Tests**: Components are rendered with mocked data to verify structure
- **Snapshot Tests**: Used for complex server components to detect unintended changes

### Client Components

For testing React Client Components:

- **Event Handling**: Verify that events trigger the correct state changes
- **Hook Integration**: Ensure custom hooks integrate correctly with components
- **User Interactions**: Test user interactions using React Testing Library

## Running Tests

To run the full test suite:

```bash
npm test
```

To run specific tests:

```bash
# Run schema generator tests
npm test src/utils/schema-generator.test.ts

# Run schema markup integration tests
npm test src/components/seo/SchemaMarkup.integration.test.ts

# Run tests for a specific feature
npm test -- -t "timezone"

# Run with coverage report
npm test -- --coverage
```

## CI/CD Integration

Tests are run automatically in the CI/CD pipeline:

1. **Pull Requests**: All tests are run when a PR is created or updated
2. **Main Branch**: Tests run before deployment to ensure quality
3. **Coverage Reports**: Test coverage reports are generated and tracked

### GitHub Actions Workflow

The application uses GitHub Actions for CI/CD with the following workflow:

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

This workflow:
- Runs on pushes to main and on pull requests
- Sets up Node.js 18
- Installs dependencies
- Runs linting checks
- Runs tests with coverage reporting
- Uploads coverage reports to Codecov

### Pre-Deployment Testing

Before deploying to production, the following tests are run:

1. **Unit and Integration Tests**: All tests must pass
2. **Code Coverage**: Coverage must be maintained at or above the threshold (80%)
3. **E2E Tests**: (Future) Critical user flows will be tested with Playwright

## Testing Best Practices

1. **Test Feature Flag Behavior**: Ensure components respect feature flag settings
2. **Test Edge Cases**: Include tests for edge cases like empty data or unexpected inputs
3. **Isolate Tests**: Tests should be self-contained and not depend on other tests
4. **Mock External Dependencies**: Use Jest mock functionality to mock external services
5. **Test Actual DOM Elements**: Verify that components render the expected DOM elements
6. **Test Accessibility**: Include tests for accessibility where applicable

## Debugging Tests

### Common Issues and Solutions

#### 1. Timezone-Related Failures

**Issue**: Tests fail with inconsistent date comparisons when running in different environments.

**Solution**: Always mock Date objects when testing timezone functionality:
```javascript
// In your test
const mockDate = new Date('2023-06-15T12:00:00Z');
jest.useFakeTimers();
jest.setSystemTime(mockDate);

// Run your test

// Clean up
jest.useRealTimers();
```

#### 2. API Mocking Issues

**Issue**: Tests fail when attempting to mock API responses.

**Solution**: Ensure MSW is properly set up and handlers are registered:
```javascript
// In your test file
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/horoscopes', (req, res, ctx) => {
    return res(ctx.json({ data: 'mocked data' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### 3. React Testing Library Queries

**Issue**: Unable to find elements in the DOM with Testing Library queries.

**Solution**: Use the correct queries based on accessibility best practices:
```javascript
// Prefer (in order):
// 1. getByRole (most accessible)
// 2. getByLabelText (form inputs)
// 3. getByText (visible text)
// 4. getByTestId (last resort)

// Instead of:
const element = screen.getByTestId('zodiac-sign');

// Use:
const element = screen.getByRole('heading', { name: /aries/i });
```

#### 4. Feature Flag Testing

**Issue**: Tests behave differently based on environment feature flags.

**Solution**: Explicitly mock feature flags in your tests:
```javascript
// Mock the feature flag module
jest.mock('@/utils/feature-flags', () => ({
  isFeatureEnabled: jest.fn()
}));

// In your test
import { isFeatureEnabled } from '@/utils/feature-flags';

// For tests when the feature is disabled
(isFeatureEnabled as jest.Mock).mockReturnValue(false);

// For tests when the feature is enabled
(isFeatureEnabled as jest.Mock).mockReturnValue(true);
```

### Debugging Commands

Useful commands for debugging tests:

```bash
# Run a single test with verbose output
npm test -- -t "test name" --verbose

# Update snapshots
npm test -- -u

# Debug tests with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Show test coverage for specific directories
npm test -- --coverage --collectCoverageFrom="src/components/**/*.tsx"
```

## Future Improvements

1. **Increase Test Coverage**: Aim for >80% test coverage across the codebase
2. **Add End-to-End Tests**: Implement Cypress or Playwright tests for critical user flows
3. **Automated Visual Testing**: Add visual regression testing for UI components
4. **Performance Testing**: Add performance benchmarks for critical operations
5. **Load Testing**: Implement tests to ensure the application can handle expected traffic
6. **Security Testing**: Add security tests for API endpoints and authentication 

## Regression Testing

Regression testing helps ensure that new changes don't break existing functionality. Our regression testing approach includes:

### 1. Test Tagging for Regression Suite

Critical tests are tagged as regression tests with a special Jest tag:

```javascript
// In any test file
describe('Critical feature', () => {
  // @regression tag in the test description tags it for regression suite
  it('@regression should handle core functionality correctly', () => {
    // Test implementation
  });
});
```

### 2. Running the Regression Test Suite

Run the regression test suite with:

```bash
npm run test:regression
```

This command is configured in package.json:

```json
"scripts": {
  "test:regression": "jest --testPathIgnorePatterns=node_modules --testMatch='**/*.@(spec|test).[jt]s?(x)' -t '@regression'"
}
```

### 3. GitHub Actions Workflow for Regression Tests

A dedicated GitHub Actions workflow runs regression tests:

```yaml
# .github/workflows/regression.yml
name: Regression Tests

on:
  # Run regression tests before each release
  push:
    branches: [main]
  # Run on schedule (every Sunday at midnight)
  schedule:
    - cron: '0 0 * * 0'
  # Allow manual trigger
  workflow_dispatch:

jobs:
  regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - name: Run regression tests
        run: npm run test:regression
      - name: Notify on failure
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            const issue = await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Regression Test Failure',
              body: `Regression tests failed on ${context.sha}. [View workflow run](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId})`
            });
```

### 4. Creating Regression Tests

When implementing regression tests:

1. **Focus on Critical Paths**: Tag tests that cover critical user flows and core business logic
2. **Cover Known Bug Fixes**: Add regression tests for any bugs that have been fixed
3. **Test Integration Points**: Include tests for key integration points between components
4. **Focus on Stability**: Regression tests should be stable and deterministic
5. **Keep the Suite Fast**: The regression suite should be optimized for speed

### 5. Implementing Regression Test Script

To create an implementation of the regression testing framework, add the following files:

#### Regression Test Script (`scripts/regression-test.js`)

```javascript
#!/usr/bin/env node

/**
 * This script extracts and runs tests tagged with @regression
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'regression-report');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🧪 Running regression tests...');

try {
  // Run Jest with the @regression tag and generate a report
  execSync(
    `jest --testPathIgnorePatterns=node_modules --testMatch='**/*.@(spec|test).[jt]s?(x)' -t '@regression' --json --outputFile=${path.join(
      outputDir,
      'regression-results.json'
    )}`,
    { stdio: 'inherit' }
  );

  console.log('✅ Regression tests completed successfully');
} catch (error) {
  console.error('❌ Regression tests failed', error.message);
  process.exit(1);
}
```

#### Update package.json

Make the script executable:

```bash
chmod +x scripts/regression-test.js
```

Then update package.json:

```json
"scripts": {
  "test:regression": "node scripts/regression-test.js"
}
```

### 6. Example Regression Tests

Here are examples of regression tests for different features:

#### Schema Markup Regression Test

```typescript
// src/components/seo/SchemaMarkup.regression.test.tsx
import { render } from '@testing-library/react';
import SchemaMarkup from './SchemaMarkup';
import { isFeatureEnabled } from '@/utils/feature-flags';
import { FEATURE_FLAGS } from '@/constants';
import { mockHoroscopes, mockZodiacSigns } from '@/mocks/data';

jest.mock('@/utils/feature-flags');

describe('SchemaMarkup component', () => {
  it('@regression should render all schema types when enabled', () => {
    (isFeatureEnabled as jest.Mock).mockReturnValue(true);
    
    const { container } = render(
      <SchemaMarkup 
        zodiacSigns={mockZodiacSigns} 
        horoscopes={mockHoroscopes} 
      />
    );
    
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    
    // Verify all expected schema types are present
    const schemas = Array.from(scripts).map(script => 
      JSON.parse(script.innerHTML)
    );
    
    const schemaTypes = schemas.map(schema => schema['@type']);
    
    // Critical schema types that must be present
    expect(schemaTypes).toContain('WebSite');
    expect(schemaTypes).toContain('BreadcrumbList');
    expect(schemaTypes).toContain('Article');
  });
});
```

#### Timezone Feature Regression Test

```typescript
// src/utils/timezone.regression.test.ts
import { getLocalDate, formatDateForDisplay } from './timezone';

describe('Timezone utilities', () => {
  beforeEach(() => {
    // Mock date to ensure consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-06-15T12:00:00Z'));
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('@regression should handle all major timezone offsets correctly', () => {
    // Test multiple timezone offsets to ensure global functionality
    const timezones = [
      { tz: 'America/New_York', expected: '2023-06-15' },
      { tz: 'Europe/London', expected: '2023-06-15' },
      { tz: 'Asia/Tokyo', expected: '2023-06-16' }, // Date line difference
      { tz: 'Pacific/Auckland', expected: '2023-06-16' },
      { tz: 'UTC', expected: '2023-06-15' }
    ];
    
    timezones.forEach(({ tz, expected }) => {
      expect(getLocalDate(tz)).toBe(expected);
    });
  });
  
  it('@regression should format dates in the correct locale format', () => {
    const date = new Date('2023-06-15');
    
    // Test various locales
    expect(formatDateForDisplay(date, 'en-US')).toBe('June 15, 2023');
    expect(formatDateForDisplay(date, 'de-DE')).toMatch(/15\.\s*Juni\s*2023/);
    expect(formatDateForDisplay(date, 'ja-JP')).toMatch(/2023年6月15日/);
  });
});
```

### 7. Regression Test Reporting

Regression test results are stored in the `regression-report` directory and can be analyzed to track:

1. **Test Stability**: Monitor which tests frequently fail
2. **Performance**: Track test execution time over time
3. **Coverage**: Ensure critical paths remain covered

Review regression test failures immediately, as they indicate potential regressions in core functionality. 