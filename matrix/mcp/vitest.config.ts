/*
 * This file is generated and managed by pipeline.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['./tests/unit/global-setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
  },
})
