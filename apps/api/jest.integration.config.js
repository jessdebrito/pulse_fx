module.exports = {
  displayName: 'api:integration',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/**/*.int.test.ts'],
  globalSetup: '<rootDir>/tests/support/database/global-setup.ts',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json', compiler: '@typescript/typescript6' }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  clearMocks: true,
};
