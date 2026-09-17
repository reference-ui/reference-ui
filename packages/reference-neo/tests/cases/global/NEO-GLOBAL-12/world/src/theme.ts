// Global rules for the GLOBAL-12 world. They take no input and emit the lib
// button mix shape: a token base plus `_hover` with an 80% oklch mix of two
// brace-token colours and `_active` with the 15.2% press ring over
// transparent. Written the way the lib button hover authors its mixes.
import { globalCss } from '@reference-ui/neo'

globalCss({
  '.ref-button': {
    backgroundColor: '{colors.ui.table.row.muted}',
    _hover: {
      backgroundColor:
        'color-mix(in oklch, {colors.ui.table.row.muted} 80%, {colors.gray.300})',
    },
    _active: {
      boxShadow:
        '0 0 0 4px color-mix(in oklch, {colors.ui.table.row.muted} 15.2%, transparent)',
    },
  },
})
