// Token source for the CORE-CHAIN-10 branch c. It takes the author tokens call and emits one leaf of its
// own, cLeaf, so branch c is a real branch that adopts its own leaf without touching the contested x.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    cLeaf: { value: '#00aa55' },
  },
})
