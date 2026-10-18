// Token source for the CORE-CHAIN-09 branch c. It takes the author tokens call and emits its override of the
// contested leaf y, plus one leaf of its own, cLeaf, so branch c never touches x.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    y: { value: '#cc0001' },
    cLeaf: { value: '#00aa55' },
  },
})
