import { globalCss } from '@reference-ui/system'
import { focusRing } from '../shared'

export const checkboxPrimitiveStyles = {
  '.ref-input[type="checkbox"]': {
    appearance: 'none',
    display: 'inline-grid',
    placeContent: 'center',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor:
      'color-mix(in oklch, {colors.ui.checkbox.unchecked.borderMix} 28%, transparent)',
    borderRadius: 'sm',
    backgroundColor: 'transparent',
    transitionProperty: 'background-color, border-color, box-shadow',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
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
    _focusVisible: focusRing,
  },
} as const

globalCss(checkboxPrimitiveStyles)
