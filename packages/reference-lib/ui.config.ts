/**
 * Reference Lib - Design system consumer
 *
 * Minimal config for testing the chainable design system pattern.
 * Uses reference-core as the live config/runtime pipeline.
 */

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'reference-ui',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
  debug: false,
})
