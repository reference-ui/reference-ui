// Brand token for the NEO-LAYERS-05 world. It takes no input and emits one tokens() call
// whose brand colour lands in the synced sheet, so the spec can prove the world synced.

import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
  },
})
