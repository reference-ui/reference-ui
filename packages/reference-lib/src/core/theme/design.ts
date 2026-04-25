// High-level design intent (sketch). Does not drive primitive CSS yet; `ui` / `colors` remain source of truth for now.
//
// Nesting: use a **group** for `text` with named tiers (`base`, `secondary`, …). Each tier is a leaf with
// `light` / `dark` keys (color mode), not a group named `light`.
//
// Reserved segment names: the color-mode pass treats any object with a key `light` or `dark` as a *leaf*
// (`resolveColorModeTokens`). So you must **not** use `light` or `dark` as a *group* key next to siblings
// (e.g. `text: { base, light: {…} }` makes `text` look like a mode leaf and breaks). Prefer `secondary` /
// `tertiary` (or `muted`) for de-emphasis steps — aligned with `colors.text.*`.
//
// References: `colors.text.*`, `ui.*`, and `components/Reference/theme/tokens` — reconcile when this graduates.

import { tokens } from '@reference-ui/system'

export const design = {
  background: { light: 'oklch(100% 0 0)', dark: '{colors.gray.950}' },
  foreground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },

  primary: {
    background: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
    foreground: { light: '{colors.gray.50}', dark: '{colors.gray.950}' },
  },

  text: {
    base: { light: '{colors.gray.800}', dark: '{colors.gray.50}' },
    secondary: { light: '{colors.gray.700}', dark: '{colors.gray.300}' },
    tertiary: { light: '{colors.gray.600}', dark: '{colors.gray.400}' },
  },
} as const

tokens({ design })
