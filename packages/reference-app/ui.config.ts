/**
 * Reference UI Configuration
 * 
 */

import { defineConfig } from '@reference-ui/cli/config'

// ============================================================================
// Configuration
// ============================================================================

export default defineConfig({
  name: 'reference-app',
  // Glob patterns for files to scan for Panda CSS extraction
  include: [
    'src/**/*.{ts,tsx,mdx}',
  ],

  debug: true,
})
