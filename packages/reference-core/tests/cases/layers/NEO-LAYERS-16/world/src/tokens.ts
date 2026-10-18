// tokens.ts — colour fragment for the NEO-LAYERS-16 consumer. It takes no inputs and emits one ink
// colour, consumerInk, which is the consumer's own token and so part of its strict vocabulary under
// layers as well as extends.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    consumerInk: { value: '#15803d' },
  },
})
