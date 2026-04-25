// High-level design intent (sketch). Does not drive primitive CSS yet; `ui` / `colors` remain source of truth for now.
//
// `text.light` = a *tier* named “light” (de-emphasized copy); per-tier `light` / `dark` = color modes. This is
// only valid because `resolveColorModeTokens` treats `light: { light: '…' }` as a group (object value on
// `light`), not a mode leaf.
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
    light: { light: '{colors.gray.700}', dark: '{colors.gray.300}' },
    lighter: { light: '{colors.gray.600}', dark: '{colors.gray.400}' },
  },
} as const

tokens({ design })
