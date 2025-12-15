import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.spec.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};

export default config;
