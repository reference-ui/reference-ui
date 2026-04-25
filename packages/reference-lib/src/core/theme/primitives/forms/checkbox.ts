import { globalCss } from '@reference-ui/system'
import { focusRingStyles } from '../shared'

export const checkboxPrimitiveStyles = {
  '.ref-input[type="checkbox"]': {
    ...focusRingStyles,
    appearance: 'none',
    display: 'inline-grid',
    placeContent: 'center',
    width: '4r',
    height: '4r',
    padding: '0',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor:
      'color-mix(in oklch, {colors.ui.checkbox.unchecked.borderMix} 28%, transparent)',
    borderRadius: 'sm',
    backgroundColor: 'transparent',
    transitionProperty:
      'background-color, border-color, box-shadow, outline-color, outline-offset',
    _checked: {
      backgroundColor: '{colors.ui.checkbox.checked.fill}',
      borderColor: '{colors.ui.checkbox.checked.fill}',
      _before: {
        opacity: 1,
      },
    },
    _before: {
      content: '""',
      width: '2r',
      height: '1r',
      borderLeftWidth: '2px',
      borderBottomWidth: '2px',
      borderLeftStyle: 'solid',
      borderBottomStyle: 'solid',
      borderColor: '{colors.ui.checkbox.tick.stroke}',
      opacity: 0,
      transform: 'translateY(-1px) rotate(-45deg)',
    },
  },
} as const

globalCss(checkboxPrimitiveStyles)
