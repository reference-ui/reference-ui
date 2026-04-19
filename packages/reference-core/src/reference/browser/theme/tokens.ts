import type { ReferenceTokenConfig } from '../../../system/api'

/** Canonical for `@reference-ui/types`; `@reference-ui/lib` maintains a parallel copy under `src/components/Reference/theme/tokens.ts` for package-local edits. */
export const referenceBrowserTokenConfig = {
  colors: {
    reference: {
      /** Primary body / heading text (was `foreground`). */
      text: {
        value: '#111827',
        dark: '#f9fafb',
      },
      /** Secondary text (was `muted`). */
      textLight: {
        value: 'oklch(44.6% 0.03 256.802)',
        dark: 'oklch(87.2% 0.01 258.338)',
      },
      /** Tertiary / de-emphasized copy (one gray step lighter than {@link textLight}). */
      textLighter: {
        value: 'oklch(55.1% 0.027 264.364)',
        dark: 'oklch(70.7% 0.022 261.325)',
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
