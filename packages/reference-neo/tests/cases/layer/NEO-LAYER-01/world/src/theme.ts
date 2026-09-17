// Global rules for the LAYER-01 world. They take no input and emit one tag
// recipe with a data-attribute variant picking the alarm colour, the way
// the lib authors multi-part anatomy. Specificity (0,2,0): above any
// utility, below the utilities layer.
import { globalCss } from '@reference-ui/neo'

globalCss({
  '.ref-chip[data-tone="alarm"]': {
    color: '{colors.alarm}',
  },
})
