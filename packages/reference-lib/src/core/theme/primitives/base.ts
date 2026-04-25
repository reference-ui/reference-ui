import { globalCss } from '@reference-ui/system'
import { baseTypography } from './typography/baseTypography'

export const base = {
  '.ref-div': {
    ...baseTypography,
  },

} as const

globalCss(base)
