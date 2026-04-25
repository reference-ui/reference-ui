import { globalCss } from '@reference-ui/system'
import { baseTypography } from '../typography/baseTypography'
import { focusRing, formControlSize } from '../shared'

export const inputPrimitiveStyles = {
  '.ref-input, .ref-select, .ref-textarea, .ref-output': {
    ...baseTypography,
    appearance: 'none',
    boxSizing: 'border-box',
    width: '100%',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.field.border}',
    borderRadius: 'sm',
    backgroundColor: '{colors.ui.field.background}',
    color: '{colors.ui.field.foreground}',
    fontSize: '3.5r',
    lineHeight: '5r',
    transitionProperty: 'color, background-color, border-color, box-shadow',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    _focusVisible: {
      ...focusRing,
      borderColor: '{colors.ui.field.focusRing}',
    },
    _disabled: {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
    _placeholder: {
      color: '{colors.ui.field.placeholder}',
    },
  },

  '.ref-input[type="checkbox"], .ref-input[type="radio"]': {
    width: '4r',
    height: '4r',
    padding: '0',
    accentColor: '{colors.ui.field.controlAccent}',
  },

  '.ref-input[type="file"]': {
    ...formControlSize,
  },

  '.ref-input, .ref-select, .ref-output': {
    ...formControlSize,
    paddingInline: '3r',
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
