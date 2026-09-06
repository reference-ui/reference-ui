import { globalCss } from '@reference-ui/system'
import { baseTypography } from './shared'

export const base = {
  '.ref-div': {
    ...baseTypography,
  },

  '[class^="ref-"]:focus-visible:not([role="option"]):not([role="menuitem"]):not([type="range"]), [class*=" ref-"]:focus-visible:not([role="option"]):not([role="menuitem"]):not([type="range"])':
    {
      outlineColor: '{colors.ui.focus.ring}',
      outlineOffset: '2px',
    },

  '[class^="ref-"]::selection, [class*=" ref-"]::selection': {
    backgroundColor: '{colors.ui.selection.background}',
    color: '{colors.ui.selection.foreground}',
  },

} as const

globalCss(base)
