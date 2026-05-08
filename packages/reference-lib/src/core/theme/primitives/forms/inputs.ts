import { globalCss } from '@reference-ui/system'
import {
  baseTypography,
  focusRingStyles,
  formControlSize,
  pressableActiveStyles,
  thumbFocusRingStyles,
  trackBackground,
} from '../shared'

export const inputPrimitiveStyles = {
  '.ref-input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), .ref-select, .ref-textarea': {
    ...baseTypography,
    appearance: 'none',
    boxSizing: 'border-box',
    width: '100%',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.field.border}',
    borderRadius: 'sm',
    ...focusRingStyles,
    backgroundColor: '{colors.ui.field.background}',
    color: '{colors.ui.field.foreground}',
    fontSize: '3.5r',
    lineHeight: '5r',
    _hover: {
      borderColor: '{colors.ui.field.borderHover}',
    },
    _focusVisible: {
      ...focusRingStyles._focusVisible,
      borderColor: '{colors.ui.field.border}',
    },
    _disabled: {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
    _placeholder: {
      color: '{colors.ui.field.placeholder}',
    },
  },

  '.ref-input[type="file"]': {
    ...baseTypography,
    ...formControlSize,
    boxSizing: 'border-box',
    width: '100%',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.field.border}',
    borderRadius: 'sm',
    ...focusRingStyles,
    backgroundColor: '{colors.ui.field.background}',
    color: '{colors.ui.field.foreground}',
    fontSize: '3.5r',
    lineHeight: '5r',
    paddingInline: '1r',
    cursor: 'pointer',
    _hover: {
      borderColor: '{colors.ui.field.borderHover}',
    },
    _focusVisible: {
      ...focusRingStyles._focusVisible,
      borderColor: '{colors.ui.field.border}',
    },
    _disabled: {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
    _file: {
      ...baseTypography,
      height: '100%',
      marginInlineEnd: '3r',
      paddingInline: '4r',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'transparent',
      borderRadius: 'sm',
      backgroundColor: '{colors.ui.button.background}',
      color: '{colors.ui.button.foreground}',
      fontSize: '3.5r',
      fontWeight: '500',
      lineHeight: '5r',
      cursor: 'pointer',
      transitionProperty: 'background-color, box-shadow, opacity',
      transitionDuration: '300ms',
      transitionTimingFunction: 'ease',
      _hover: {
        backgroundColor:
          'color-mix(in oklch, {colors.ui.button.background} 90%, transparent)',
      },
      _active: pressableActiveStyles('var(--colors-ui-button-background)'),
    },
  },

  '.ref-input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), .ref-select': {
    ...formControlSize,
    paddingInline: '3r',
  },

  '.ref-input[type="color"]::-webkit-color-swatch-wrapper': {
    padding: '0',
  },

  '.ref-input[type="color"]::-webkit-color-swatch': {
    borderWidth: '0',
    borderRadius: 'sm',
  },

  '.ref-input[type="color"]::-moz-color-swatch': {
    borderWidth: '0',
    borderRadius: 'sm',
  },

  '.ref-input[type="range"]': {
    appearance: 'none',
    WebkitAppearance: 'none',
    display: 'block',
    width: '100%',
    height: '4r',
    padding: '0',
    borderWidth: '0',
    borderRadius: '0',
    background: 'transparent',
    backgroundColor: 'transparent',
    color: '{colors.ui.progress.bar.foreground}',
    accentColor: '{colors.ui.progress.bar.foreground}',
    cursor: 'pointer',
    outline: 'none',
  },

  '.ref-input[type="range"]::-webkit-slider-runnable-track': {
    height: '1.5r',
    borderRadius: 'full',
    background: trackBackground,
    backgroundColor: trackBackground,
  },

  '.ref-input[type="range"]::-webkit-slider-thumb': {
    WebkitAppearance: 'none',
    appearance: 'none',
    width: 'calc(4 * var(--spacing-root) - 1px)',
    height: 'calc(4 * var(--spacing-root) - 1px)',
    marginTop: 'calc(-1.25 * var(--spacing-root) + 0.5px)',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.field.background}',
    borderRadius: 'full',
    backgroundColor: '{colors.ui.progress.bar.foreground}',
    transitionProperty: 'box-shadow, transform',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
  },

  '.ref-input[type="range"]:focus-visible::-webkit-slider-thumb': {
    ...thumbFocusRingStyles,
  },

  '.ref-input[type="range"]:active::-webkit-slider-thumb': {
    ...pressableActiveStyles('{colors.ui.progress.bar.foreground}'),
  },

  '.ref-input[type="range"]::-moz-range-track': {
    height: '1.5r',
    borderWidth: '0',
    borderRadius: 'full',
    background: trackBackground,
    backgroundColor: trackBackground,
  },

  '.ref-input[type="range"]::-moz-range-progress': {
    height: '1.5r',
    borderRadius: 'full',
    background: '{colors.ui.progress.bar.foreground}',
    backgroundColor: '{colors.ui.progress.bar.foreground}',
  },

  '.ref-input[type="range"]::-moz-range-thumb': {
    width: 'calc(4 * var(--spacing-root) - 1px)',
    height: 'calc(4 * var(--spacing-root) - 1px)',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.field.background}',
    borderRadius: 'full',
    backgroundColor: '{colors.ui.progress.bar.foreground}',
    transitionProperty: 'box-shadow, transform',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
  },

  '.ref-input[type="range"]:focus-visible::-moz-range-thumb': {
    ...thumbFocusRingStyles,
  },

  '.ref-input[type="range"]:active::-moz-range-thumb': {
    ...pressableActiveStyles('{colors.ui.progress.bar.foreground}'),
  },

  '.ref-output': {
    ...baseTypography,
    ...formControlSize,
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    maxWidth: '100%',
    paddingInline: '3r',
    borderRadius: 'sm',
    backgroundColor: '{colors.ui.samp.background}',
    color: '{colors.ui.samp.foreground}',
    fontSize: '3.5r',
    lineHeight: '5r',
    cursor: 'default',
  },

  '.ref-textarea': {
    minHeight: '20r',
    paddingInline: '3r',
    paddingBlock: '2r',
    resize: 'vertical',
  },

  '.ref-datalist, .ref-optgroup, .ref-option': {
    ...baseTypography,
    color: '{colors.ui.field.foreground}',
    backgroundColor: '{colors.ui.field.background}',
  },
} as const

globalCss(inputPrimitiveStyles)
