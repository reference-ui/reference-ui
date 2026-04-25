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
    backgroundColor: '{colors.ui.radio.track.background}',
    transitionProperty: 'border-color, border-width, background-color, box-shadow',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    _checked: {
      backgroundColor: '{colors.ui.radio.checked.inner.background}',
      borderWidth: '0.95r',
      borderColor: '{colors.ui.radio.checked.ring.border}',
    },
    _focusVisible: focusRing,
  },
} as const

globalCss(radioPrimitiveStyles)
