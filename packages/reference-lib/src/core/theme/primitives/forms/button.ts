import { globalCss } from '@reference-ui/system'
import {
  baseTypography,
  focusRingStyles,
  controlSize,
  pressableActiveStyles,
} from '../shared'

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
    '& > [data-slot="icon"]:first-child:not(:only-child), & > svg:first-child:not(:only-child)': {
      marginInlineStart: 'var(--reference-icon-offset, calc(-1 * var(--spacing-root, 4px)))',
    },
    '& > [data-slot="icon"]:last-child:not(:only-child), & > svg:last-child:not(:only-child)': {
      marginInlineEnd: 'var(--reference-icon-offset, calc(-1 * var(--spacing-root, 4px)))',
    },
    '&:where(:has(> [data-slot="icon"]:only-child, > svg:only-child))': {
      paddingInline: '0',
      aspectRatio: '1 / 1',
      width: 'auto',
    },
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
    _active: pressableActiveStyles('var(--colors-ui-button-background)'),
    _disabled: {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      color: '{colors.ui.button.disabled.foreground}',
      backgroundColor: '{colors.ui.button.disabled.background}',
    },
  },
} as const

globalCss(buttonPrimitiveStyles)
