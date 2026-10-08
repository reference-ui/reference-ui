// Global rules for the GLOBAL-04 world. They take no input and emit one `.ref-q`
// rule with a token colour plus before/after quote marks. Mirrors the lib
// inline-text quote shape.
import { globalCss } from '@reference-ui/neo'

globalCss({
  '.ref-q': {
    color: '{colors.ui.q.foreground}',
    fontStyle: 'italic',
    _before: {
      content: '"\\201C"',
    },
    _after: {
      content: '"\\201D"',
    },
  },
})
