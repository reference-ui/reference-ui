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
    borderColor: 'var(--ui-input)',
    borderRadius: 'sm',
    backgroundColor: 'var(--ui-background)',
    color: 'var(--ui-foreground)',
    fontSize: '3.5r',
    lineHeight: '5r',
    transitionProperty: 'color, background-color, border-color, box-shadow',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    _focusVisible: {
      ...focusRing,
      borderColor: 'var(--ui-ring)',
    },
    _disabled: {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
    _placeholder: {
      color: 'var(--ui-muted-foreground)',
    },
  },

  '.ref-input[type="checkbox"], .ref-input[type="radio"]': {
    width: '4r',
    height: '4r',
    padding: '0',
    accentColor: 'var(--ui-primary)',
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
    color: 'var(--ui-foreground)',
    backgroundColor: 'var(--ui-background)',
  },
} as const

globalCss(inputPrimitiveStyles)
