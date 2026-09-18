// Global rules for the GLOBAL-06 world. They take no input and emit the panda
// complex-nesting shape: a comma of two combinator selectors carrying a base
// margin plus an '& ~ &' sibling key. The nested value is a literal length so
// the paint proof reads real margins, not a unitless number.
import { globalCss } from '@reference-ui/neo'

globalCss({
  'body > p, body > ul': {
    margin: 0,
    '& ~ &': {
      marginTop: '10px',
    },
  },
})
