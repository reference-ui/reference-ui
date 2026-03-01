/**
 * Reference Lib - Design system consumer
 *
 * Minimal config for testing the chainable design system pattern.
 * Uses reference-core's defineConfig; will extend baseSystem once that API exists.
 */

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  include: ['src/**/*.{ts,tsx}'],
})
