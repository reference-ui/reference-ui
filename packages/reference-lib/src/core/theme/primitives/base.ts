import { globalCss } from '@reference-ui/system'
import { baseTypography } from './shared'

export const base = {
  '.ref-div': {
    ...baseTypography,
  },

  '[class^="ref-"]:focus-visible, [class*=" ref-"]:focus-visible': {
    outlineColor: '{colors.ui.focus.ring}',
    outlineOffset: '2px',
  },

  '[class^="ref-"]::selection, [class*=" ref-"]::selection': {
    backgroundColor: '{colors.ui.selection.background}',
    color: '{colors.ui.selection.foreground}',
  },

} as const

globalCss(base)
