export default {
  displayName: 'web',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/unit/**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/tests/support/setup-tests.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json', compiler: '@typescript/typescript6' }],
  },
  moduleNameMapper: {
    '^chart\\.js$': '<rootDir>/tests/support/mocks/chart-js.ts',
  },
  clearMocks: true,
};
