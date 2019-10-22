module.exports = {
  roots: ['<rootDir>'],
  testMatch: [
    '**/*.test.ts',
    '**/provider/*.test.js'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
}
