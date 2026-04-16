import { globalCss } from '@reference-ui/system'
import { baseTypography } from './baseTypography'

export const base = {
  '.ref-div': {
    ...baseTypography,
  },

} as const

globalCss(base)
