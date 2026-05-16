module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testRegex: '.*\\.(spec|test)\\.ts$',
  collectCoverageFrom: ['src/**/*.{ts}', '!src/**/*.module.ts'],
};
