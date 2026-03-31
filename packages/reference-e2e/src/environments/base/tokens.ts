/**
 * Token config for test sandboxes. Ref sync discovers this file and registers tokens.
 */

import { tokens } from '@reference-ui/system'

export const tokensConfig = {
  colors: {
    test: {
      primary: { value: '#2563eb' },
      muted: { value: '#94a3b8' },
      colorMode: { value: '#dbeafe', dark: '#1e293b' },
    },
  },
  spacing: {
    'test-sm': { value: '0.5rem' },
    'test-md': { value: '1rem' },
  },
  radii: {
    'test-round': { value: '0.5rem' },
  },
  borderWidths: {
    'test-1': { value: '2px' },
  },
} as const

tokens(tokensConfig)
