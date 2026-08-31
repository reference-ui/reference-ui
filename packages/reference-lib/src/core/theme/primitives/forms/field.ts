import {
  baseTypography,
  formControlSize,
} from '../shared'

const embeddedControl = ':is(input, textarea, select, .ref-input, .ref-textarea, .ref-select)'

export const fieldSurfaceStyles = {
  '[data-reference-field]': {
    ...baseTypography,
    ...formControlSize,
    appearance: 'none',
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2r',
    minWidth: '0',
    maxWidth: '100%',
    paddingInline: '3r',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.field.border}',
    borderRadius: 'sm',
    backgroundColor: '{colors.ui.field.background}',
    color: '{colors.ui.field.foreground}',
    fontSize: '3.5r',
    lineHeight: '5r',
    outline: '2px solid transparent',
    outlineOffset: '4px',
    transitionProperty:
      'border-color, box-shadow, opacity, outline-color, outline-offset',
    transitionDuration: '300ms',
    transitionTimingFunction: 'ease',
    _hover: {
      borderColor: '{colors.ui.field.borderHover}',
    },
  },

  [`[data-reference-field] :is(input, textarea, select), [data-reference-field] .ref-input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), [data-reference-field] .ref-textarea, [data-reference-field] .ref-select`]: {
    appearance: 'none',
    boxSizing: 'border-box',
    flex: '1',
    minWidth: '0',
    width: '100%',
    height: '100%',
    margin: '0',
    padding: '0',
    borderWidth: '0',
    borderStyle: 'none',
    borderRadius: '0',
    backgroundColor: 'transparent',
    boxShadow: 'none',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    letterSpacing: 'inherit',
    lineHeight: 'inherit',
    outline: 'none',
    _hover: {
      borderColor: 'transparent',
    },
    _focusVisible: {
      outline: 'none',
      boxShadow: 'none',
      borderColor: 'transparent',
    },
    _disabled: {
      cursor: 'not-allowed',
      opacity: '1',
    },
  },

  [`[data-reference-field]:has(${embeddedControl}:focus-visible), [data-reference-field][data-focus-visible]`]:
    {
      outlineWidth: '2px',
      outlineOffset: '2px',
      outlineStyle: 'solid',
      outlineColor: '{colors.ui.focus.ring}',
      borderColor: '{colors.ui.field.border}',
    },

  '[data-reference-field]:has([aria-invalid="true"]), [data-reference-field][data-invalid]': {
    borderColor: '{colors.red.500}',
  },

  '[data-reference-field][data-status="warning"]': {
    borderColor: '{colors.amber.500}',
  },

  '[data-reference-field][data-status="warning"]:has([aria-invalid="true"]), [data-reference-field][data-status="warning"][data-invalid]':
    {
      borderColor: '{colors.red.500}',
    },

  [`[data-reference-field]:has(${embeddedControl}:disabled), [data-reference-field][data-disabled]`]:
    {
      cursor: 'not-allowed',
      opacity: 0.5,
    },

  '[data-reference-field]:has(:is(input, textarea, .ref-input, .ref-textarea)[readonly]), [data-reference-field][data-readonly]':
    {
      backgroundColor: '{colors.ui.samp.background}',
    },

  '[data-reference-field]:has(textarea, .ref-textarea)': {
    height: 'auto',
    alignItems: 'start',
    paddingBlock: '2r',
  },

  '[data-reference-field] > .ref-button': {
    flexShrink: 0,
    height: '6r',
    minHeight: '0',
    paddingBlock: '0',
    paddingInline: '2r',
  },

  '[data-reference-number-field]': {
    width: 'max-content',
    maxWidth: '100%',
  },

  '[data-reference-number-field] :is(input, .ref-input)': {
    flex: '0 0 18r',
    width: '18r',
    minWidth: '12r',
  },
} as const
