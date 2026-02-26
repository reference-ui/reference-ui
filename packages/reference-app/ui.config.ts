/**
 * Reference UI Configuration
 * 
 * This file shows the complete API surface for configuring Reference UI.
 * Reference UI is compile-time first with a minimal, un-opinionated API.
 * 
 * Runtime API:
 * - css()       - Style primitive
 * - recipe()    - Multi-variant component styles
 * - cssGlobal() - Global styles
 * 
 * Build-time API:
 * - defineConfig() - Configuration
 * - tokens()       - Design system tokens
 * - keyframes()    - Animation definitions
 */

import { defineConfig } from '@reference-ui/core'

// ============================================================================
// Configuration
// ============================================================================

export default defineConfig({
  // Glob patterns for files to scan for Panda CSS extraction
  include: [
    'src/**/*.{ts,tsx}',
  ],

  // Optional: Enable normalize CSS reset (default: true)
  normalizeCss: true,

  // Optional: Use reference-ui design system (default: true)
  useDesignSystem: true,
})
