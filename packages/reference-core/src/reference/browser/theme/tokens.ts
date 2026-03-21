import type { ReferenceTokenConfig } from '../../../system/api'

export const referenceBrowserTokenConfig = {
  colors: {
    reference: {
      foreground: {
        value: '#0f172a',
        dark: '#f8fafc',
      },
      muted: {
        value: '#475569',
        dark: '#94a3b8',
      },
      border: {
        value: '#e2e8f0',
        dark: '#334155',
      },
      background: {
        value: '#ffffff',
        dark: '#0f172a',
      },
      subtleBackground: {
        value: '#f8fafc',
        dark: '#111827',
      },
      primary: {
        value: 'oklch(54.6% 0.245 262.881)',
        dark: 'oklch(80.9% 0.105 251.813)',
      },
      primaryForeground: {
        value: '#ffffff',
        dark: 'oklch(28.2% 0.091 267.935)',
      },
      primarySoftBackground: {
        value: 'oklch(93.2% 0.032 255.585)',
        dark: 'oklch(28.2% 0.091 267.935)',
      },
      primarySoftBorder: {
        value: 'oklch(88.2% 0.059 254.128)',
        dark: 'oklch(37.9% 0.146 265.522)',
      },
      primarySoftForeground: {
        value: 'oklch(48.8% 0.243 264.376)',
        dark: 'oklch(88.2% 0.059 254.128)',
      },
    },
  },
  spacing: {
    reference: {
      xxs: { value: '0.125rem' },
      xs: { value: '0.25rem' },
      sm: { value: '0.5rem' },
      md: { value: '0.75rem' },
      lg: { value: '1rem' },
      xl: { value: '1.5rem' },
    },
  },
  fonts: {
    reference: {
      mono: {
        value:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace',
      },
    },
  },
} as const satisfies ReferenceTokenConfig
