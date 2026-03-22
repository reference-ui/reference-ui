import type { ReferenceTokenConfig } from '../../../system/api'

/** Canonical for `@reference-ui/types`; `@reference-ui/lib` maintains a parallel copy under `src/Reference/theme/tokens.ts` for package-local edits. */
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
        dark: '#1e3a8a',
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
        dark: '#93c5fd',
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
      /**
       * Keep in sync with `@reference-ui/lib` `theme/fontStacks.ts` / JetBrains `mono` registration.
       */
      mono: {
        value: '"JetBrains Mono", ui-monospace, monospace',
      },
    },
  },
} as const satisfies ReferenceTokenConfig
