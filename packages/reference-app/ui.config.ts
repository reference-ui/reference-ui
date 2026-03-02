/**
 * Reference UI Configuration
 * 
 */

import { defineConfig } from '@reference-ui/core'

// ============================================================================
// Configuration
// ============================================================================

export default defineConfig({
  name: 'reference-app',
  // Glob patterns for files to scan for Panda CSS extraction
  include: [
    'src/**/*.{ts,tsx}',
  ],
})
