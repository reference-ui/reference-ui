// Base primitive styles: icon-shell color inheritance, focus-visible, selection.
// It takes nothing and emits the `base` globalCss map applied before every group.
import { globalCss } from '@reference-ui/system'
import { baseTypography } from './shared'

export const base = {
  // The icon shell is a Div but must inherit its container's colour (e.g. a
  // primary Button's label). Icons ship in an earlier cascade layer, so a pin
  // here would beat both their `color: inherit` default and an explicit colour.
  '.ref-div:not([data-slot="icon"])': {
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
