// Global rules for the GLOBAL-02 world. They take no input and emit the lib
// body shape in two calls: `:root` spacing vars, then body typography with a
// rhythm size plus inline-size containment. Mirrors `global.ts` bodyStyles.
import { globalCss } from '@reference-ui/neo'

globalCss({ ':root': { '--spacing-root': '0.25rem' } })

globalCss({
  body: {
    fontFamily: 'sans',
    letterSpacing: '-0.01em',
    fontSize: '4r',
    containerType: 'inline-size',
  },
})
