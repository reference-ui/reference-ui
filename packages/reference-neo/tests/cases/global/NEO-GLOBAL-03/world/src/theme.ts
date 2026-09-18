// Global rules for the GLOBAL-03 world. They take no input and emit one
// `.ref-button` tag recipe with a nested slot selector plus the disabled,
// hover, and focus-visible twins. Mirrors the lib button primitive shape.
import { globalCss } from '@reference-ui/neo'

globalCss({
  '.ref-button': {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#111111',
    fontSize: '20px',
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
})
