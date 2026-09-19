// High-level `design` sketch (same `light` / `dark` color refs as `ui` where they overlap; duplicated
// here so the token tree stays under `design.*` without import/reference merge quirks).

import { tokens } from '@reference-ui/system'

export const design = {
  background: { light: 'oklch(100% 0 0)', dark: '{colors.gray.950}' },
  foreground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },

  primary: {
    background: { light: '{colors.gray.950}', dark: '{colors.gray.100}' },
    foreground: { light: '{colors.gray.50}', dark: '{colors.gray.950}' },
    hover: {
      background: { light: '{colors.gray.900}', dark: '{colors.gray.50}' },
    },
  },

  accent: {
    foreground: { light: '{colors.blue.600}', dark: '{colors.blue.300}' },
    background: { light: '{colors.gray.100}', dark: '{colors.gray.950}' },
    hover: { light: '{colors.blue.800}', dark: '{colors.blue.300}' },
    border: { light: '{colors.gray.300}', dark: '{colors.blue.950}' },
  },

  text: {
    base: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
    light: { light: '{colors.gray.700}', dark: '{colors.gray.300}' },
    lighter: { light: '{colors.gray.600}', dark: '{colors.gray.400}' },
  },

  mark: {
    background: { light: '{colors.blue.200}', dark: '{colors.blue.950}' },
    foreground: { light: '{colors.blue.950}', dark: '{colors.blue.200}' },
  },

  // Provenance: stillborn-leaf fix; no green sibling exists in theme, so this
  // mirrors the 600-light/400-dark semantic-foreground convention of
  // ui.meter.evenLessGood.foreground, transposed to the green hue.
  positive: {
    text: { light: '{colors.green.600}', dark: '{colors.green.400}' },
  },

  // Provenance: stillborn-leaf fix; mirrors the convergent quiet-inset fills
  // ui.pre.background and ui.tab.track.background (both gray.100/900).
  bg: {
    muted: { light: '{colors.gray.100}', dark: '{colors.gray.900}' },
  },
} as const

tokens({ colors: { design } })
