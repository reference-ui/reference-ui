// Global rules for the GLOBAL-11 world. They take no input and emit two
// lib-shaped vendor rules with literal pseudo-element selectors: a range
// thumb background and a file-button text colour. Token refs ride in the
// declarations the way the lib range and file inputs carry them.
import { globalCss } from '@reference-ui/neo'

globalCss({
  '.ref-range::-webkit-slider-thumb': {
    webkitAppearance: 'none',
    appearance: 'none',
    backgroundColor: '{colors.ui.progress.bar.foreground}',
    width: '24px',
    height: '16px',
  },
  '.ref-upload::file-selector-button': {
    color: '{colors.ui.file.button}',
    backgroundColor: '{colors.ui.file.field}',
  },
})
