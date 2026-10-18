// Tokens for the CORE-DIAG-67 world. It takes no inputs and emits the brand
// colour plus one declared tone, so the misspelled `mediun` in tone.ts has a
// real neighbour to be suggested against, exactly as the shared repro row does.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
  },
  tones: {
    medium: { surface: { value: '10%' }, line: { value: '34%' } },
  },
})
