import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'js/**/*.test.ts'],
    testTimeout: 10000,
    globalSetup: './tests/tasty/globalSetup.ts',
  },
})
