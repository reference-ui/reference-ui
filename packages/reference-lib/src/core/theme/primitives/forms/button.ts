import { globalCss } from '@reference-ui/system'
import { baseTypography } from '../typography/baseTypography'
import { focusRing, formControlSize } from '../shared'

export const buttonPrimitiveStyles = {
  '.ref-button': {
    ...baseTypography,
    appearance: 'none',
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    gap: '2r',
    ...formControlSize,
    paddingInline: '4r',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: 'sm',
    backgroundColor: '{colors.ui.primary}',
    color: '{colors.ui.primaryForeground}',
    fontSize: '3.5r',
    fontWeight: '500',
    lineHeight: '5r',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    transitionProperty: 'color, background-color, border-color, box-shadow, opacity',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    _hover: {
      backgroundColor:
        'color-mix(in oklch, {colors.ui.primary} 90%, transparent)',
    },
    _focusVisible: focusRing,
    _disabled: {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
} as const

globalCss(buttonPrimitiveStyles)
