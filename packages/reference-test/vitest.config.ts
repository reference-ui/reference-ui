import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 60_000,
    teardownTimeout: 10_000,
    pool: 'forks',
  },
  globalTeardown: './src/lib/teardown.ts',
})
