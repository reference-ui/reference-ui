// Token fragment for the CORE-LAYERS-01 layered upstream. It defines an ink and
// a paper colour: the ink ranks against the extends colour, the paper paints
// alone, and both leaves pin the portable [data-layer] token scope.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    layInk: { value: '#be185d' },
    layPaper: { value: '#ccfbf1' },
  },
})
