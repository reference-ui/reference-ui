import { globalCss } from '@reference-ui/system'
import { focusRingStyles } from '../shared'

export const switchPrimitiveStyles = {
  '.ref-button[data-reference-switch]': {
    ...focusRingStyles,
    appearance: 'none',
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexShrink: 0,
    width: '11r',
    height: '6r',
    padding: '0.5r',
    gap: '0',
    borderWidth: '0',
    borderStyle: 'none',
    borderRadius: 'full',
    backgroundColor: '{colors.gray.300}',
    color: 'transparent',
    fontSize: '0',
    lineHeight: '0',
    cursor: 'pointer',
    userSelect: 'none',
    _hover: {
      backgroundColor: '{colors.gray.400}',
    },
    _active: {
      boxShadow: 'none',
    },
    _disabled: {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      opacity: 0.55,
    },
  },

  '.ref-button[data-reference-switch][data-state="checked"]': {
    backgroundColor: '{colors.ui.checkbox.checked.fill}',
    _hover: {
      backgroundColor: '{colors.ui.checkbox.checked.fill}',
    },
  },

  '[data-reference-switch-thumb]': {
    display: 'block',
    width: '5r',
    height: '5r',
    flexShrink: 0,
    borderRadius: 'full',
    backgroundColor: '{colors.ui.checkbox.tick.stroke}',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transform: 'translateX(0)',
    transitionProperty: 'transform',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
    pointerEvents: 'none',
  },

  '[data-reference-switch-thumb][data-state="checked"]': {
    transform: 'translateX(5r)',
  },
} as const

globalCss(switchPrimitiveStyles)
