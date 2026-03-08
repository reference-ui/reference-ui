/**
 * Reference Lib - Design system consumer
 *
 * Minimal config for testing the chainable design system pattern.
 * Uses reference-cli as the live config/runtime pipeline.
 */

import { defineConfig } from '@reference-ui/cli'

export default defineConfig({
  name: 'reference-ui',
  include: ['src/**/*.{ts,tsx}'],
  extends: [], // no upstream — reference-lib is the root
  debug: true,
})
 