/**
 * Reference Lib - Design system consumer
 *
 * Minimal config for testing the chainable design system pattern.
 * Uses reference-core as the live config/runtime pipeline.
 */

import { defineConfig } from '@reference-ui/core'
import { baseSystem as iconsBaseSystem } from '@reference-ui/icons/baseSystem'

export default defineConfig({
  name: 'reference-ui',
  include: ['src/**/*.{ts,tsx}'],
  extends: [iconsBaseSystem],
  debug: false,
})
