import { globalCss } from '@reference-ui/system'
import { baseTypography, focusRingStyles, controlSize } from '../shared'

export const buttonPrimitiveStyles = {
  '.ref-button': {
    ...baseTypography,
    appearance: 'none',
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5em',
    ...controlSize,
    paddingInline: '3.5r',
    '& > [data-slot="icon"], & > svg': {
      fontSize: 'inherit',
    },
    '& > [data-slot="icon"]:first-child:not(:only-child), & > svg:first-child:not(:only-child)': {
      marginInlineStart: 'var(--reference-icon-offset, -0.25em)',
    },
    '& > [data-slot="icon"]:last-child:not(:only-child), & > svg:last-child:not(:only-child)': {
      marginInlineEnd: 'var(--reference-icon-offset, -0.25em)',
    },
    '&:where(:has(> [data-slot="icon"]:only-child, > svg:only-child))': {
      paddingInline: '0',
      aspectRatio: '1 / 1',
      width: 'auto',
    },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: 'md',
    ...focusRingStyles,
    fontSize: '3.5r',
    fontWeight: '500',
    lineHeight: '5r',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    _disabled: {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      color: '{colors.ui.button.disabled.foreground}',
      backgroundColor: '{colors.ui.button.disabled.background}',
    },
  },
  '.ref-button:where([data-variant="default"], :not([data-variant]))': {
    backgroundColor: '{colors.ui.button.default.background}',
    color: '{colors.design.text.base}',
    borderColor: 'transparent',
    _hover: {
      backgroundColor: '{colors.ui.button.default.hover}',
    },
    _active: {
      backgroundColor: '{colors.ui.button.default.pressed}',
    },
  },
  '.ref-button:where([data-variant="primary"])': {
    backgroundColor: '{colors.ui.button.background}',
    color: '{colors.ui.button.foreground}',
    borderColor: 'transparent',
    _hover: {
      backgroundColor: '{colors.ui.button.hover}',
    },
    _active: {
      backgroundColor: '{colors.ui.button.pressed}',
    },
  },
  '.ref-button:where([data-variant="ghost"])': {
    backgroundColor: 'transparent',
    color: '{colors.design.text.base}',
    borderColor: 'transparent',
    _hover: {
      backgroundColor: '{colors.ui.button.ghost.hover}',
    },
    _active: {
      backgroundColor: '{colors.ui.button.ghost.pressed}',
    },
  },
} as const

globalCss(buttonPrimitiveStyles)
