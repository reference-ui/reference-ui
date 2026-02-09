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
 * - config()    - Configuration
 * - tokens()    - Design system tokens
 * - keyframes() - Animation definitions
 */

import { config, tokens, keyframes, cssGlobal } from '@reference-ui/core'

// ============================================================================
// Configuration
// ============================================================================

config({
  /**
   * Normalize CSS - adds a modern CSS reset.
   * Set to false if you're using your own reset.
   */
  normalizeCss: true,


  // use reference-ui components and tokens
  // recommended for most projects
  useDesignSystem: true,


  // scan folders for API and MCP extraction
  scanFolders: [
    '*'
  ]
})


tokens({
  colors: {
    brand: {
      500: '#3b82f6',
      600: '#2563eb',
    },
    gray: {
      100: '#f3f4f6',
      900: '#111827',
    },
  },

  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    4: '1rem',
  },

  fontSizes: {
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
  },

  radii: {
    sm: '0.125rem',
    md: '0.375rem',
    full: '9999px',
  },
})

keyframes({
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
})

keyframes({
  spin: {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
})


cssGlobal({
  'html, body': {
    fontFamily: 'system-ui, sans-serif',
    lineHeight: 1.5,
  },
})
