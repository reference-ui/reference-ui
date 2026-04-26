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
    foreground: { light: '{colors.blue.700}', dark: '{colors.blue.400}' },
    hover: { light: '{colors.blue.800}', dark: '{colors.blue.300}' },
    background: { light: '{colors.blue.50}', dark: '{colors.blue.950}' },
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
} as const

tokens({ colors: { design } })
