import { globalCss } from '@reference-ui/system'
import { baseTypography, focusRingStyles, formControlSize } from '../shared'

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
    ...focusRingStyles,
    backgroundColor: '{colors.ui.button.background}',
    color: '{colors.ui.button.foreground}',
    fontSize: '3.5r',
    fontWeight: '500',
    lineHeight: '5r',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    _hover: {
      backgroundColor:
        'color-mix(in oklch, {colors.ui.button.background} 90%, transparent)',
    },
    _active: {
      outlineOffset: '2px',
      outlineColor:
        'color-mix(in oklch, var(--colors-ui-focus-ring) 61.8%, transparent)',
      boxShadow:
        '0 2px 0 color-mix(in oklch, var(--colors-ui-button-foreground) 61.8%, transparent)',
    },
    _disabled: {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
} as const

globalCss(buttonPrimitiveStyles)
