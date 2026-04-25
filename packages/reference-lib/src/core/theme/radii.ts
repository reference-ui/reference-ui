import { tokens } from '@reference-ui/system'

export const radii = {
  sm: { value: '0.25rem' },
  md: { value: '0.5rem' },
  lg: { value: '1rem' },
  full: { value: '9999px' },
} as const

tokens({ radii })
