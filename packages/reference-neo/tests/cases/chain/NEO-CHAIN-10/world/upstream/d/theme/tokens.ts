// Token source for the NEO-CHAIN-10 diamond d. It takes the author tokens call and emits one leaf of its
// own, dLeaf, so the app must carry a leaf from the diamond itself as well as the branches' leaves.

import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    dLeaf: { value: '#5500aa' },
  },
})
