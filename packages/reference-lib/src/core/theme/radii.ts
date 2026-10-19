// Radii tokens: sm/md/lg steps plus the full pill radius.
// It takes nothing and emits the `radii` token tree.
import { tokens } from '@reference-ui/system'

export const radii = {
  sm: { value: '0.27rem' },
  md: { value: '0.4rem' },
  lg: { value: '0.6rem' },
  full: { value: '9999px' },
} as const

tokens({ radii })
