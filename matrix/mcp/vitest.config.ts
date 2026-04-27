import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['./unit/global-setup.ts'],
    include: ['unit/**/*.test.ts'],
  },
})
