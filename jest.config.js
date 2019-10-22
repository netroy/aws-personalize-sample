module.exports = {
  roots: ['<rootDir>'],
  testMatch: [
    '**/*.test.ts',
    '**/lambda-packages/*.test.js'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
}
