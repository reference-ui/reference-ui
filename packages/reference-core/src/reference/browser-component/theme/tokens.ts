// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/theme/tokens.ts
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import { tokens } from '@reference-ui/system'
import { fontStacks } from './fontStacks'

type ReferenceBrowserTokenConfig = Parameters<typeof tokens>[0]

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
      codeBackground: {
        value: '{colors.gray.100}',
        dark: '{colors.gray.900}',
      },
      highlight: {
        value: '{colors.blue.200}',
        dark: '{colors.blue.200}',
      },
      border: {
        value: '#d1d5db',
        dark: '{colors.gray.500}',
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
