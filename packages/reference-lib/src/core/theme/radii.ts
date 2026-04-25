import { tokens } from '@reference-ui/system'

export const radii = {
  sm: { value: '0.27rem' },
  md: { value: '0.4rem' },
  lg: { value: '0.6rem' },
  full: { value: '9999px' },
} as const

tokens({ radii })
