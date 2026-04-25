import { globalCss } from '@reference-ui/system'
import { focusRing } from '../shared'

export const radioPrimitiveStyles = {
  '.ref-input[type="radio"]': {
    appearance: 'none',
    display: 'inline-block',
    boxSizing: 'border-box',
    borderStyle: 'solid',
    borderWidth: '0',
    borderColor: 'transparent',
    borderRadius: 'full',
    backgroundColor: '{colors.ui.muted}',
    transitionProperty: 'border-color, border-width, background-color, box-shadow',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    _checked: {
      backgroundColor: '{colors.ui.background}',
      borderWidth: '0.95r',
      borderColor: '{colors.ui.foreground}',
    },
    _focusVisible: focusRing,
  },
} as const

globalCss(radioPrimitiveStyles)
