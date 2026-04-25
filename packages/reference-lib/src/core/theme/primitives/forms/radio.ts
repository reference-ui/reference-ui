import { globalCss } from '@reference-ui/system'
import { focusRingStyles } from '../shared'

export const radioPrimitiveStyles = {
  '.ref-input[type="radio"]': {
    ...focusRingStyles,
    appearance: 'none',
    display: 'inline-block',
    boxSizing: 'border-box',
    width: '4r',
    height: '4r',
    padding: '0',
    borderStyle: 'solid',
    borderWidth: '0',
    borderColor: 'transparent',
    borderRadius: 'full',
    backgroundColor: '{colors.ui.radio.track.background}',
    transitionProperty:
      'border-color, border-width, background-color, box-shadow, outline-color, outline-offset',
    _checked: {
      backgroundColor: '{colors.ui.radio.checked.inner.background}',
      borderWidth: '0.95r',
      borderColor: '{colors.ui.radio.checked.ring.border}',
    },
  },
} as const

globalCss(radioPrimitiveStyles)
