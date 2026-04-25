import { globalCss } from '@reference-ui/system'
import { baseTypography } from './shared'

export const base = {
  '.ref-div': {
    ...baseTypography,
  },

} as const

globalCss(base)
