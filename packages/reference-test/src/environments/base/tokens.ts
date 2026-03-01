/**
 * Token config for test sandboxes. Plain data – no runtime deps.
 */

export const tokensConfig = {
  colors: {
    test: {
      primary: { value: '#2563eb' },
      muted: { value: '#94a3b8' },
    },
  },
  spacing: {
    'test-sm': { value: '0.5rem' },
    'test-md': { value: '1rem' },
  },
  radii: {
    'test-round': { value: '0.5rem' },
  },
} as const
