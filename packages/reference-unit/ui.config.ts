/**
 * Reference UI Configuration
 *
 * Uses reference-lib only. Fixture integration (extend-library, layer-library) deferred
 * until build orchestration supports pre-building without blocking test:system.
 */

import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib'

export default defineConfig({
  name: 'reference-unit',
  extends: [baseSystem],
  include: ['src/**/*.{ts,tsx,mdx}'],
  debug: true,
})
