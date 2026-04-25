import { tokens } from '@reference-ui/system'

export const ui = {
  background: { light: 'oklch(100% 0 0)', dark: '{colors.gray.950}' },
  foreground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
  primary: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
  primaryForeground: { light: '{colors.gray.50}', dark: '{colors.gray.950}' },
  secondary: { light: '{colors.gray.100}', dark: '{colors.gray.800}' },
  secondaryForeground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
  muted: { light: '{colors.gray.100}', dark: '{colors.gray.800}' },
  mutedForeground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
  accent: { light: '{colors.gray.100}', dark: '{colors.gray.800}' },
  accentForeground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
  destructive: { light: '{colors.red.600}', dark: '{colors.red.500}' },
  destructiveForeground: { light: 'oklch(100% 0 0)', dark: '{colors.gray.50}' },
  border: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
  input: { light: '{colors.gray.200}', dark: '{colors.gray.700}' },
  ring: { light: '{colors.gray.400}', dark: '{colors.gray.500}' },
  link: { light: '{colors.blue.700}', dark: '{colors.blue.400}' },
  linkHover: { light: '{colors.blue.800}', dark: '{colors.blue.300}' },
  codeBackground: { light: '{colors.gray.100}', dark: '{colors.gray.900}' },
  codeForeground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
  quoteBorder: { light: '{colors.gray.300}', dark: '{colors.gray.700}' },
  mark: { light: '{colors.blue.200}', dark: '{colors.blue.950}' },
  markForeground: { light: '{colors.blue.950}', dark: '{colors.blue.200}' },
} as const

tokens({ ui })
