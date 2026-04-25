import { tokens } from '@reference-ui/system'
import { colors } from './colors'

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
        value: colors.gray[800].value,
        dark: '#f9fafb',
      },
      /** Secondary text (was `muted`). */
      textLight: {
        value: colors.gray[700].value,
        dark: colors.gray[300].value,
      },
      /** Tertiary / de-emphasized copy (one gray step lighter than {@link textLight}). */
      textLighter: {
        value: colors.gray[600].value,
        dark: colors.gray[400].value,
      },
      codeBackground: {
        value: colors.gray[200].value,
        dark: colors.gray[900].value,
      },
      highlight: {
        value: colors.blue[800].value,
        dark: colors.blue[200].value,
      },
      border: {
        value: colors.gray[300].value,
        dark: colors.gray[800].value,
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
