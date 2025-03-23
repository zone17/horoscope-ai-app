// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));

// Mock the process.env
process.env = {
  ...process.env,
  NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS: 'true',
  NODE_ENV: 'test',
}; 