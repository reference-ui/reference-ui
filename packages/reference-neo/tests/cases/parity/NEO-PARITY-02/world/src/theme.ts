// Tag recipes for the PARITY-01 mini-lib world. They take no input and emit
// the lib-shaped global layer: :root rhythm and gutter vars, the body
// baseline with inline-size containment, nine .ref-* tag recipes with
// :where() variant scoping (P3) and :is() condition twins, the field bezel
// with its invalid :has() compound and data-slot children, plus the file and
// range vendor pseudos. Every style object is literal; every var hand-written.
import { globalCss } from '@reference-ui/neo'

globalCss({
  ':root': {
    '--spacing-root': '0.25rem',
    '--parity-gutter': '24px',
  },
})

globalCss({
  body: {
    color: '#111111',
    fontFamily: 'sans',
    letterSpacing: '-0.01em',
    fontSize: '4r',
    containerType: 'inline-size',
  },
  '.ref-button': {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.button.background}',
    backgroundColor: 'transparent',
    color: '{colors.ink}',
    fontSize: '4r',
    '& > [data-slot="icon"]': {
      marginInlineStart: 'var(--reference-icon-offset, -0.25em)',
    },
    _disabled: {
      color: '{colors.ui.button.disabled.foreground}',
      backgroundColor: '{colors.ui.button.disabled.background}',
    },
    _hover: {
      borderColor: '{colors.ui.field.borderHover}',
    },
    _focusVisible: {
      outlineColor: '{colors.ui.focus.ring}',
      outlineWidth: '2px',
      outlineStyle: 'solid',
    },
  },
  '.ref-button:where([data-variant="primary"])': {
    backgroundColor: '{colors.ui.button.background}',
    color: '{colors.ui.button.foreground}',
  },
  '.ref-button:has([data-slot="icon"])': {
    paddingInlineStart: '0.5rem',
  },
  '.ref-input': {
    color: '{colors.ui.field.foreground}',
    backgroundColor: '{colors.ui.field.background}',
    borderWidth: '0',
  },
  '.ref-input::placeholder': {
    color: '{colors.ui.field.placeholder}',
  },
  '[data-reference-field]': {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.field.border}',
  },
  '[data-reference-field]:has([aria-invalid="true"]), [data-reference-field][data-invalid]': {
    borderColor: '{colors.red.500}',
  },
  '[data-reference-field] > [data-slot="control"]': {
    padding: '0.5rem',
  },
  '.ref-file::file-selector-button': {
    color: '{colors.ui.file.button}',
    backgroundColor: '{colors.ui.file.field}',
  },
  '.ref-range::-webkit-slider-thumb': {
    webkitAppearance: 'none',
    appearance: 'none',
    backgroundColor: '{colors.ui.progress.bar.foreground}',
    width: '24px',
    height: '16px',
  },
  '.ref-disclosure': {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.disclosure.border}',
  },
  '.ref-disclosure > summary': {
    color: '{colors.ink}',
    cursor: 'pointer',
    _focusVisible: {
      outlineColor: '{colors.ui.focus.ring}',
      outlineWidth: '2px',
      outlineStyle: 'solid',
    },
  },
  '.ref-table': {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.table.border}',
    borderCollapse: 'collapse',
  },
  '.ref-table > thead > th': {
    color: 'color-mix(in srgb, {colors.ink} 80%, {colors.paper})',
  },
  '.ref-table > tbody > tr': {
    _hover: {
      backgroundColor: '{colors.ui.table.rowHover}',
    },
  },
  '.ref-link': {
    color: '{colors.accent}',
    textDecoration: 'underline',
  },
  '.ref-link:focus-visible': {
    outlineColor: '{colors.ui.focus.ring}',
  },
  '.ref-q': {
    color: '{colors.ink}',
    fontStyle: 'italic',
    _before: {
      content: '"\\201C"',
    },
    _after: {
      content: '"\\201D"',
    },
  },
  '.ref-list > li::marker': {
    color: '{colors.accent}',
  },
})
