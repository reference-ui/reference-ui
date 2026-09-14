/**
 * Vitest configuration for the tasty module test suite.
 * Configures test inclusion for type scanning, declaration generation, and projection cases.
 * Registers global fixture initialization setup for end-to-end tasty artifact testing.
 */
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const setupPath = fileURLToPath(new URL('./tests/globalSetup.ts', import.meta.url))

export default defineConfig({
  test: {
    name: 'tasty',
    include: [
      'tests/**/*.test.ts',
      'js/**/*.test.ts',
    ],
    globalSetup: [setupPath],
  },
})
