import { tokens } from '@reference-ui/system'

type ReferenceTokenConfig = Parameters<typeof tokens>[0]

/**
 * Reference UI browser token palette for this package — **owned here** (mirror of
 * `reference-core/src/reference/browser/theme/tokens.ts`). Edit this file; run `ref sync`.
 */
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
      /** Accent chips (SummaryChip); must exist or Panda emits invalid raw `reference.primary` in CSS. */
      primary: {
        value: '#2563eb',
        dark: '#60a5fa',
      },
      primarySoftBackground: {
        value: '#eff6ff',
        dark: '{colors.blue.100}',
      },
      primarySoftBorder: {
        value: '#bfdbfe',
        dark: '#1e40af',
      },
      primaryForeground: {
        value: '#ffffff',
        dark: '#0f172a',
      },
      primarySoftForeground: {
        value: '#1e40af',
        dark: '{colors.blue.900}',
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
      sans: {
        value: '"Inter", ui-sans-serif, sans-serif',
      },
    },
  },
} as const satisfies ReferenceTokenConfig

tokens(referenceBrowserTokenConfig)
