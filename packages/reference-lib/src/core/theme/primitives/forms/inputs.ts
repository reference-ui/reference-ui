import { globalCss } from '@reference-ui/system'
import { setupFocusVisible } from './focus-visible'
import {
  baseTypography,
  controlSize,
  pressableActiveStyles,
  thumbFocusRingStyles,
  trackBackground,
  sliderTrack,
  sliderThumb,
} from '../shared'
import { fieldSurfaceStyles } from './field'

setupFocusVisible()

const fieldBase = fieldSurfaceStyles['[data-reference-field]']

export const inputPrimitiveStyles = {
  '.ref-input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), .ref-select, .ref-textarea': {
    ...fieldBase,
    display: undefined,
    alignItems: undefined,
    gap: undefined,
    minWidth: undefined,
    maxWidth: undefined,
    width: '100%',
    paddingInline: '3r',
    outlineOffset: '2px',
    _hover: {
      borderColor: '{colors.ui.field.borderHover}',
    },
    _focus: {
      outline: 'none',
      borderColor: '{colors.ui.focus.ring}',
    },
    '&:focus': {
      outline: 'none',
      outlineWidth: '0px',
      outlineStyle: 'none',
      outlineColor: 'transparent',
      borderColor: '{colors.ui.focus.ring}',
    },
    '&:focus:hover': {
      borderColor: '{colors.ui.focus.ring}',
    },
    '&[data-focus-visible]': {
      outlineWidth: '2px',
      outlineOffset: '2px',
      outlineStyle: 'solid',
      outlineColor: '{colors.ui.focus.ring}',
      borderColor: '{colors.ui.field.borderHover}',
    },
    '&[data-focus-visible]:focus': {
      outlineWidth: '2px',
      outlineOffset: '2px',
      outlineStyle: 'solid',
      outlineColor: '{colors.ui.focus.ring}',
      borderColor: '{colors.ui.field.borderHover}',
    },
    '&[data-focus-visible]:focus:hover': {
      borderColor: '{colors.ui.field.borderHover}',
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
    ...fieldBase,
    display: undefined,
    alignItems: undefined,
    gap: undefined,
    minWidth: undefined,
    maxWidth: undefined,
    width: '100%',
    paddingInline: '1r',
    outlineOffset: '2px',
    cursor: 'pointer',
    _hover: {
      borderColor: '{colors.ui.field.borderHover}',
    },
    _focus: {
      outline: 'none',
      borderColor: '{colors.ui.focus.ring}',
    },
    '&:focus': {
      outline: 'none',
      outlineWidth: '0px',
      outlineStyle: 'none',
      outlineColor: 'transparent',
      borderColor: '{colors.ui.focus.ring}',
    },
    '&:focus:hover': {
      borderColor: '{colors.ui.focus.ring}',
    },
    '&[data-focus-visible]': {
      outlineWidth: '2px',
      outlineOffset: '2px',
      outlineStyle: 'solid',
      outlineColor: '{colors.ui.focus.ring}',
      borderColor: '{colors.ui.field.borderHover}',
    },
    '&[data-focus-visible]:focus': {
      outlineWidth: '2px',
      outlineOffset: '2px',
      outlineStyle: 'solid',
      outlineColor: '{colors.ui.focus.ring}',
      borderColor: '{colors.ui.field.borderHover}',
    },
    '&[data-focus-visible]:focus:hover': {
      borderColor: '{colors.ui.field.borderHover}',
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
      borderColor: '{colors.ui.field.border}',
      borderRadius: 'sm',
      backgroundColor: '{colors.ui.table.row.mutedBackground}',
      color: '{colors.design.text.base}',
      fontSize: '3.5r',
      fontWeight: '500',
      lineHeight: '5r',
      cursor: 'pointer',
      transitionProperty:
        'background-color, border-color, box-shadow, opacity',
      transitionDuration: '150ms',
      transitionTimingFunction: 'ease',
      _hover: {
        backgroundColor:
          'color-mix(in oklch, {colors.ui.table.row.mutedBackground} 80%, {colors.gray.300})',
        borderColor: '{colors.ui.field.borderHover}',
      },
      _active: pressableActiveStyles('var(--colors-ui-table-row-muted-background)'),
    },
  },

  '.ref-input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), .ref-select': {
    ...controlSize,
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
    height: '6r',
    padding: '0',
    borderWidth: '0',
    borderRadius: '0',
    background: 'transparent',
    backgroundColor: 'transparent',
    color: '{colors.ui.progress.bar.foreground}',
    accentColor: '{colors.ui.progress.bar.foreground}',
    cursor: 'pointer',
    outline: 'none',
    _focus: {
      outline: 'none',
    },
    _focusVisible: {
      outline: 'none',
    },
    '&:focus': {
      outline: 'none',
      outlineWidth: '0px',
      outlineStyle: 'none',
      outlineColor: 'transparent',
      boxShadow: 'none',
    },
    '&:focus-visible': {
      outline: 'none',
      outlineWidth: '0px',
      outlineStyle: 'none',
      outlineColor: 'transparent',
      boxShadow: 'none',
    },
    '&[data-focus-visible]': {
      outline: 'none',
      outlineWidth: '0px',
      outlineStyle: 'none',
      outlineColor: 'transparent',
      boxShadow: 'none',
    },
    '&[data-focus-visible]:focus': {
      outline: 'none',
      outlineWidth: '0px',
      outlineStyle: 'none',
      outlineColor: 'transparent',
      boxShadow: 'none',
    },
  },

  '.ref-input[type="range"]::-webkit-slider-runnable-track': {
    height: sliderTrack.height,
    borderRadius: 'full',
    background: `linear-gradient(to right, {colors.ui.progress.bar.foreground} 0%, {colors.ui.progress.bar.foreground} var(--range-percent, 0%), ${trackBackground} var(--range-percent, 0%), ${trackBackground} 100%)`,
    backgroundColor: trackBackground,
  },

  '.ref-input[type="range"]::-webkit-slider-thumb': {
    WebkitAppearance: 'none',
    appearance: 'none',
    width: sliderThumb.lengthPx,
    height: sliderThumb.crossPx,
    marginTop: `calc((${sliderTrack.heightPx} - ${sliderThumb.crossPx}) / 2)`,
    borderWidth: '0',
    borderRadius: sliderThumb.borderRadius,
    backgroundColor: '{colors.ui.progress.bar.foreground}',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transitionProperty: 'box-shadow, transform',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
  },

  '.ref-input[type="range"]:focus-visible::-webkit-slider-thumb, .ref-input[type="range"][data-focus-visible]::-webkit-slider-thumb': {
    outlineWidth: '2px',
    outlineOffset: '2px',
    outlineStyle: 'solid',
    outlineColor: '{colors.ui.focus.ring}',
    boxShadow: 'none',
  },

  '.ref-input[type="range"]:active::-webkit-slider-thumb': {
    ...pressableActiveStyles('{colors.ui.progress.bar.foreground}'),
  },

  '.ref-input[type="range"]::-moz-range-track': {
    height: sliderTrack.height,
    borderWidth: '0',
    borderRadius: 'full',
    background: trackBackground,
    backgroundColor: trackBackground,
  },

  '.ref-input[type="range"]::-moz-range-progress': {
    height: sliderTrack.height,
    borderRadius: 'full',
    background: '{colors.ui.progress.bar.foreground}',
    backgroundColor: '{colors.ui.progress.bar.foreground}',
  },

  '.ref-input[type="range"]::-moz-range-thumb': {
    width: sliderThumb.lengthPx,
    height: sliderThumb.crossPx,
    borderWidth: '0',
    borderRadius: sliderThumb.borderRadius,
    backgroundColor: '{colors.ui.progress.bar.foreground}',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transitionProperty: 'box-shadow, transform',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
  },

  '.ref-input[type="range"]:focus-visible::-moz-range-thumb, .ref-input[type="range"][data-focus-visible]::-moz-range-thumb': {
    outlineWidth: '2px',
    outlineOffset: '2px',
    outlineStyle: 'solid',
    outlineColor: '{colors.ui.focus.ring}',
    boxShadow: 'none',
  },

  '.ref-input[type="range"]:active::-moz-range-thumb': {
    ...pressableActiveStyles('{colors.ui.progress.bar.foreground}'),
  },

  '[data-reference-slider-thumb]': {
    outline: '2px solid transparent',
    outlineOffset: '2px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transitionProperty: 'box-shadow, transform, outline-color',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
  },

  '[data-reference-slider-thumb]:focus-visible, [data-reference-slider-thumb][data-focus-visible]': {
    outlineWidth: '2px',
    outlineOffset: '2px',
    outlineStyle: 'solid',
    outlineColor: '{colors.ui.focus.ring}',
    boxShadow: 'none',
  },

  '[data-reference-slider-thumb]:active, [data-reference-slider-thumb][data-active]': {
    ...pressableActiveStyles('{colors.ui.progress.bar.foreground}'),
  },

  '[data-reference-slider]:active [data-reference-slider-thumb]': {
    ...pressableActiveStyles('{colors.ui.progress.bar.foreground}'),
  },

  '.ref-output': {
    ...baseTypography,
    ...controlSize,
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
globalCss(fieldSurfaceStyles)
