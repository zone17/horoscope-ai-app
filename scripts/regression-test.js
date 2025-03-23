#!/usr/bin/env node

/**
 * This script runs regression tests
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
  // Define specific regression test files
  const regressionTestFiles = [
    'src/utils/timezone.regression.test.ts',
    'src/app/api/horoscopes/cache.regression.test.ts',
    'src/utils/schema-generator.regression.test.ts'
  ];

  // Run Jest on the specific regression test files
  execSync(
    `jest ${regressionTestFiles.join(' ')} --json --outputFile=${path.join(
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