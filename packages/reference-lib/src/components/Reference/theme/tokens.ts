import { tokens } from '@reference-ui/system'

type ReferenceBrowserTokenConfig = Parameters<typeof tokens>[0]

/**
 * Reference UI browser token palette for this package — **owned here** (mirror of
 * `reference-core/src/reference/browser/theme/tokens.ts`). Edit this file; run `ref sync`.
 */
export const referenceBrowserTokenConfig = {
  colors: {
    reference: {
      /** Primary body / heading text (was `foreground`). */
      text: {
        value: '{colors.gray.800}',
        dark: '{colors.gray.50}',
      },
      /** Secondary text (was `muted`). */
      textLight: {
        value: '{colors.gray.700}',
        dark: '{colors.gray.300}',
      },
      /** Tertiary / de-emphasized copy (one gray step lighter than {@link textLight}). */
      textLighter: {
        value: '{colors.gray.600}',
        dark: '{colors.gray.400}',
      },
      codeBackground: {
        value: '{colors.gray.200}',
        dark: '{colors.gray.900}',
      },
      highlight: {
        value: '{colors.blue.800}',
        dark: '{colors.blue.200}',
      },
      border: {
        value: '{colors.gray.300}',
        dark: '{colors.gray.800}',
      },
    },
  },
  fonts: {
    reference: {
      /** Alias the stacks registered by {@link ../../../core/theme/fonts}. */
      mono: { value: '{fonts.mono}' },
      /** Alias the stacks registered by {@link ../../../core/theme/fonts}. */
      sans: { value: '{fonts.sans}' },
    },
  },
} as const satisfies ReferenceBrowserTokenConfig

tokens(referenceBrowserTokenConfig)
