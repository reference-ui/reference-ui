import { tokens } from '@reference-ui/system'
import { fontStacks } from '../../theme/fontStacks'

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
        value: '#111827',
        dark: '#f9fafb',
      },
      /** Secondary text (was `muted`). */
      textLight: {
        value: '{colors.gray.600}',
        dark: '{colors.gray.300}',
      },
      /** Tertiary / de-emphasized copy (one gray step lighter than {@link textLight}). */
      textLighter: {
        value: '{colors.gray.500}',
        dark: '{colors.gray.400}',
      },
      codeBackground: {
        value: '{colors.gray.100}',
        dark: '{colors.gray.900}',
      },
      highlight: {
        value: '{colors.blue.600}',
        dark: '{colors.blue.200}',
      },
      border: {
        value: '#d1d5db',
        dark: '{colors.gray.800}',
      },
    },
  },
  fonts: {
    reference: {
      /** Same stack as global `mono` + JetBrains `@font-face` in {@link ../../theme/fonts}. */
      mono: { value: fontStacks.mono },
      /** Same stack as global `sans` + Inter `@font-face` in {@link ../../theme/fonts}. */
      sans: { value: fontStacks.sans },
    },
  },
} as const satisfies ReferenceBrowserTokenConfig

tokens(referenceBrowserTokenConfig)
