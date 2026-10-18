// tokens.ts — colour fragment for the CORE-TYPE-09 world. It takes no inputs and
// emits one nested blue scale leaf (blue.500) and one tone (medium), so blue.500
// is a real ColorToken and blue.500/medium a real TonedColorToken.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    blue: {
      500: { value: '#3b82f6' },
    },
  },
  tones: {
    medium: { surface: { value: '10%' }, line: { value: '34%' } },
  },
})
