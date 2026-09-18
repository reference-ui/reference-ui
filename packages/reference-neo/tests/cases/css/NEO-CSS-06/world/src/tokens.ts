// Tokens for the NEO-CSS-06 world. It takes no inputs and emits the two
// gradient stops, so the sheet and the browser resolve the refs without
// reaching for any other system.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    ember: { value: '#ff0000' },
    ocean: { value: '#0000ff' },
  },
})
