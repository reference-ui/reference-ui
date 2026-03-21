import type { ReferenceTokenConfig } from '../../../system/api'

export const referenceBrowserTokenConfig = {
  colors: {
    reference: {
      foreground: {
        value: '#111827',
        dark: '#f9fafb',
      },
      muted: {
        value: '#4b5563',
        dark: '#9ca3af',
      },
      border: {
        value: '#d1d5db',
        dark: '#374151',
      },
      background: {
        value: '#ffffff',
        dark: '#111827',
      },
      subtleBackground: {
        value: '#f9fafb',
        dark: '#1f2937',
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
