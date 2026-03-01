/**
 * Reference Lib - Design system consumer
 *
 * Minimal config for testing the chainable design system pattern.
 * Uses reference-core's defineConfig; will extend baseSystem once that API exists.
 */

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'reference-ui',
  include: ['src/**/*.{ts,tsx}'],
  extends: [], // no upstream — reference-lib is the root
})
 