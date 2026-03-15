/**
 * Reference UI Configuration
 * 
 */

import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib'

// ============================================================================
// Configuration
// ============================================================================

export default defineConfig({
  name: 'reference-unit',
  extends: [baseSystem],
  // Glob patterns for files to scan for Panda CSS extraction
  include: [
    'src/**/*.{ts,tsx,mdx}',
  ],

  debug: true,
})
